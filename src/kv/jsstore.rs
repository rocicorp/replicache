use crate::kv::{Read, Result, Store, Write};
use crate::util::rlog::LogContext;
use async_trait::async_trait;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    pub type JsStore;
    #[wasm_bindgen(method, catch, js_name=read)]
    async fn read_impl(this: &JsStore) -> std::result::Result<JsValue, JsValue>;
    #[wasm_bindgen(method, catch, js_name=write)]
    async fn write_impl(this: &JsStore) -> std::result::Result<JsValue, JsValue>;
    #[wasm_bindgen(method, js_name=close)]
    async fn close_impl(this: &JsStore);

    type JsRead;
    #[wasm_bindgen(method, catch)]
    async fn has(this: &JsRead, key: &str) -> std::result::Result<JsValue, JsValue>;
    #[wasm_bindgen(method, catch)]
    async fn get(this: &JsRead, key: &str) -> std::result::Result<JsValue, JsValue>;

    type JsRelease;
    #[wasm_bindgen(method)]
    fn release(this: &JsRelease);

    type JsWrite;
    #[wasm_bindgen(method, catch)]
    async fn put(
        this: &JsWrite,
        key: &str,
        value: &js_sys::Uint8Array,
    ) -> std::result::Result<(), JsValue>;
    #[wasm_bindgen(method, catch)]
    async fn del(this: &JsWrite, key: &str) -> std::result::Result<(), JsValue>;
    #[wasm_bindgen(method, catch)]
    async fn commit(this: &JsWrite) -> std::result::Result<(), JsValue>;
}

impl JsStore {
    pub fn new(js: JsValue) -> JsStore {
        js.unchecked_into::<JsStore>()
    }
}

#[async_trait(?Send)]
impl Store for JsStore {
    async fn read<'a>(&'a self, _lc: LogContext) -> Result<Box<dyn Read + 'a>> {
        let v = self.read_impl().await?;
        let r = v.unchecked_into::<JsRead>();
        Ok(Box::new(JsReadProxy::new(r)))
    }

    async fn write<'a>(&'a self, _lc: LogContext) -> Result<Box<dyn Write + 'a>> {
        let v = self.write_impl().await?;
        let w = v.unchecked_into::<JsWrite>();
        Ok(Box::new(JsWriteProxy::new(w)))
    }

    async fn close(&self) {
        self.close_impl().await;
    }
}

struct JsReadProxy {
    js: JsRead,
}

impl JsReadProxy {
    fn new(js: JsRead) -> JsReadProxy {
        JsReadProxy { js }
    }
}

#[async_trait(?Send)]
impl Read for JsReadProxy {
    async fn has(&self, key: &str) -> Result<bool> {
        has(&self.js, key).await
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        get(&self.js, key).await
    }
}

async fn has(js: &JsRead, key: &str) -> Result<bool> {
    let v: JsValue = js.has(key).await?;
    Ok(v == JsValue::TRUE)
}

async fn get(js: &JsRead, key: &str) -> Result<Option<Vec<u8>>> {
    let v: JsValue = js.get(key).await?;
    Ok(if v.is_undefined() {
        None
    } else {
        Some(v.unchecked_into::<js_sys::Uint8Array>().to_vec())
    })
}

// We need to implement drop so that we can release the underlying lock on the
// js side. This also prevents us from directly using the JsValue and we have to
// wrap it in a Rust proxy.
impl Drop for JsReadProxy {
    fn drop(&mut self) {
        self.js.unchecked_ref::<JsRelease>().release();
    }
}

struct JsWriteProxy {
    js: JsWrite,
}

impl JsWriteProxy {
    fn new(js: JsWrite) -> JsWriteProxy {
        JsWriteProxy { js }
    }
}

#[async_trait(?Send)]
impl Read for JsWriteProxy {
    async fn has(&self, key: &str) -> Result<bool> {
        has(self.js.unchecked_ref::<JsRead>(), key).await
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        get(self.js.unchecked_ref::<JsRead>(), key).await
    }
}

impl Drop for JsWriteProxy {
    fn drop(&mut self) {
        self.js.unchecked_ref::<JsRelease>().release();
    }
}

#[async_trait(?Send)]
impl Write for JsWriteProxy {
    fn as_read(&self) -> &dyn Read {
        self
    }

    async fn put(&self, key: &str, value: &[u8]) -> Result<()> {
        Ok(self.js.put(key, &js_sys::Uint8Array::from(value)).await?)
    }

    async fn del(&self, key: &str) -> Result<()> {
        Ok(self.js.del(key).await?)
    }

    async fn commit(self: Box<Self>) -> Result<()> {
        Ok(self.js.commit().await?)
    }
}
