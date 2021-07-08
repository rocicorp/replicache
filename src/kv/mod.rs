pub mod idbstore;
pub mod jsstore;
pub mod memstore;

use crate::util::rlog::LogContext;
use async_trait::async_trait;
use std::fmt;

#[derive(Debug, PartialEq)]
pub enum StoreError {
    Str(String),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreError::Str(s) => write!(f, "{}", s),
        }
    }
}

type Result<T> = std::result::Result<T, StoreError>;

#[async_trait(?Send)]
pub trait Store {
    async fn read<'a>(&'a self, lc: LogContext) -> Result<Box<dyn Read + 'a>>;
    async fn write<'a>(&'a self, lc: LogContext) -> Result<Box<dyn Write + 'a>>;

    async fn put(&self, key: &str, value: &[u8]) -> Result<()> {
        let lc = LogContext::new();
        let wt = self.write(lc).await?;
        wt.put(key, value).await?;
        Ok(wt.commit().await?)
    }

    async fn has(&self, key: &str) -> Result<bool> {
        let lc = LogContext::new();
        Ok(self.read(lc).await?.has(key).await?)
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let lc = LogContext::new();
        Ok(self.read(lc).await?.get(key).await?)
    }

    async fn close(&self);
}

#[async_trait(?Send)]
pub trait Read {
    async fn has(&self, key: &str) -> Result<bool>;
    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>>;
}

#[async_trait(?Send)]
pub trait Write: Read {
    fn as_read(&self) -> &dyn Read;

    async fn put(&self, key: &str, value: &[u8]) -> Result<()>;
    async fn del(&self, key: &str) -> Result<()>;

    async fn commit(self: Box<Self>) -> Result<()>;
}

pub mod trait_tests {
    use super::Store;
    use crate::util::rlog::LogContext;
    use std::future::Future;

    pub async fn run_all<F, T>(new_store: F)
    where
        F: Fn() -> T,
        T: Future<Output = Box<dyn Store>>,
    {
        // I played with listing references to each test function in a vec
        // and iterating them instead of calling them explicitly like below,
        // but it seems to require boxing them which just makes it awkward instead
        // of elegant and simple.
        let mut s = new_store().await;
        store(&mut *s).await;
        s = new_store().await;
        read_transaction(&mut *s).await;
        s = new_store().await;
        write_transaction(&mut *s).await;
        s = new_store().await;
        isolation(&mut *s).await;
    }

    pub async fn store(store: &mut dyn Store) {
        // Test put/has/get, which use read() and write() for one-shot txs.
        assert!(!store.has("foo").await.unwrap());
        assert_eq!(None, store.get("foo").await.unwrap());

        store.put("foo", b"bar").await.unwrap();
        assert!(store.has("foo").await.unwrap());
        assert_eq!(Some(b"bar".to_vec()), store.get("foo").await.unwrap());

        store.put("foo", b"baz").await.unwrap();
        assert!(store.has("foo").await.unwrap());
        assert_eq!(Some(b"baz".to_vec()), store.get("foo").await.unwrap());

        assert!(!store.has("baz").await.unwrap());
        assert_eq!(None, store.get("baz").await.unwrap());
        store.put("baz", b"bat").await.unwrap();
        assert!(store.has("baz").await.unwrap());
        assert_eq!(Some(b"bat".to_vec()), store.get("baz").await.unwrap());
    }

    pub async fn read_transaction(store: &mut dyn Store) {
        store.put("k1", b"v1").await.unwrap();

        let rt = store.read(LogContext::new()).await.unwrap();
        assert!(rt.has("k1").await.unwrap());
        assert_eq!(Some(b"v1".to_vec()), rt.get("k1").await.unwrap());
    }

    pub async fn write_transaction(store: &mut dyn Store) {
        store.put("k1", b"v1").await.unwrap();
        store.put("k2", b"v2").await.unwrap();

        // Test put then commit.
        let wt = store.write(LogContext::new()).await.unwrap();
        assert!(wt.has("k1").await.unwrap());
        assert!(wt.has("k2").await.unwrap());
        wt.put("k1", b"overwrite").await.unwrap();
        wt.commit().await.unwrap();
        assert_eq!(Some(b"overwrite".to_vec()), store.get("k1").await.unwrap());
        assert_eq!(Some(b"v2".to_vec()), store.get("k2").await.unwrap());

        // Test put then rollback.
        let wt = store.write(LogContext::new()).await.unwrap();
        wt.put("k1", b"should be rolled back").await.unwrap();
        drop(wt);
        assert_eq!(Some(b"overwrite".to_vec()), store.get("k1").await.unwrap());

        // Test del then commit.
        let wt = store.write(LogContext::new()).await.unwrap();
        wt.del("k1").await.unwrap();
        assert!(!wt.has("k1").await.unwrap());
        wt.commit().await.unwrap();
        assert!(!store.has("k1").await.unwrap());

        // Test del then rollback.
        assert!(store.has("k2").await.unwrap());
        let wt = store.write(LogContext::new()).await.unwrap();
        wt.del("k2").await.unwrap();
        assert!(!wt.has("k2").await.unwrap());
        drop(wt);
        assert!(store.has("k2").await.unwrap());

        // Test overwrite multiple times then commit.
        let wt = store.write(LogContext::new()).await.unwrap();
        wt.put("k2", b"overwrite").await.unwrap();
        wt.del("k2").await.unwrap();
        wt.put("k2", b"final").await.unwrap();
        wt.commit().await.unwrap();
        assert_eq!(Some(b"final".to_vec()), store.get("k2").await.unwrap());

        // Test as_read.
        let wt = store.write(LogContext::new()).await.unwrap();
        wt.put("k2", b"new value").await.unwrap();
        let rt = wt.as_read();
        assert!(rt.has("k2").await.unwrap());
        assert_eq!(Some(b"new value".to_vec()), rt.get("k2").await.unwrap());
    }

    pub async fn isolation(store: &mut dyn Store) {
        use async_std::future::timeout;
        use std::time::Duration;

        // We don't get line numbers in stack traces in wasm so we use an error message
        // which is logged to console to identify the issue. AFAICT this does nothing
        // when running regular tests, but that's ok because we get useful stack traces
        // in that case.
        fn spew(msg: &str) {
            error!("", "{}", msg);
        }

        // Assert there can be multiple concurrent read txs...
        let r1 = store.read(LogContext::new()).await.unwrap();
        let r2 = store
            .read(LogContext::new())
            .await
            .expect("should be able to open second read");
        // and that while outstanding they prevent write txs...
        let dur = Duration::from_millis(200);
        let w = store.write(LogContext::new());
        if timeout(dur, w).await.is_ok() {
            spew("2 open read tx should have prevented new write");
            panic!();
        }
        // until both the reads are done...
        drop(r1);
        let w = store.write(LogContext::new());
        if timeout(dur, w).await.is_ok() {
            spew("1 open read tx should have prevented new write");
            panic!();
        }
        drop(r2);
        let w = store.write(LogContext::new()).await.unwrap();

        // At this point we have a write tx outstanding. Assert that
        // we cannot open another write transaction.
        let w2 = store.write(LogContext::new());
        if timeout(dur, w2).await.is_ok() {
            spew("1 open write tx should have prevented new write");
            panic!();
        }

        // The write tx is still outstanding, ensure we cannot open
        // a read tx until it is finished.
        let r = store.read(LogContext::new());
        if timeout(dur, r).await.is_ok() {
            spew("1 open write tx should have prevented new read");
            panic!();
        }
        drop(w);
        let r = store.read(LogContext::new()).await.unwrap();
        assert!(!r.has("foo").await.unwrap());
    }
}
