use crate::kv::{Store, StoreError};
use crate::util::rlog::LogContext;
use crate::util::uuid::uuid;

pub async fn init(s: &dyn Store, lc: LogContext) -> Result<String, InitClientIdError> {
    use InitClientIdError::*;

    const CID_KEY: &str = "sys/cid";
    let cid = s.get(CID_KEY).await.map_err(GetErr)?;
    if let Some(cid) = cid {
        let s = String::from_utf8(cid).map_err(InvalidUtf8)?;
        return Ok(s);
    }
    let wt = s.write(lc).await.map_err(OpenErr)?;
    let uuid = uuid();
    wt.put(CID_KEY, &uuid.as_bytes())
        .await
        .map_err(PutClientIdErr)?;
    wt.commit().await.map_err(CommitErr)?;
    Ok(uuid)
}

#[derive(Debug)]
pub enum InitClientIdError {
    CommitErr(StoreError),
    GetErr(StoreError),
    InvalidUtf8(std::string::FromUtf8Error),
    OpenErr(StoreError),
    PutClientIdErr(StoreError),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;

    #[async_std::test]
    async fn test_init_client_id() {
        let ms = Box::new(MemStore::new());
        let cid1 = init(ms.as_ref(), LogContext::new()).await.unwrap();
        let cid2 = init(ms.as_ref(), LogContext::new()).await.unwrap();
        assert_eq!(cid1, cid2);
        let ms = Box::new(MemStore::new());
        let cid3 = init(ms.as_ref(), LogContext::new()).await.unwrap();
        assert_ne!(cid1, cid3);
    }
}
