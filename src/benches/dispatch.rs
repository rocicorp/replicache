use crate::benches::{random_bytes, random_string};
use crate::dispatch::*;
use crate::kv::idbstore::IdbStore;
use crate::kv::Store;
use wasm_bench::*;

async fn opendb() -> String {
    let dbname = random_string(12);
    dispatch(dbname.clone(), "open".into(), "".into())
        .await
        .unwrap();
    dbname
}

async fn eval(code: &str) {
    wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(&js_sys::eval(code).unwrap()))
        .await
        .unwrap();
}

#[wasm_bench]
async fn noop(b: &mut Bench) {
    let dbname = opendb().await;

    let _ = IdbStore::new(&dbname).await.unwrap().unwrap();
    b.reset_timer();
    eval(&format!(
        "
        (async _ => {{
            for (let i = 0; i < {}; i++) {{
                await dispatch('{}', 'open', '');
            }}
        }})()",
        b.iterations(),
        dbname
    ))
    .await;
}

#[wasm_bench]
async fn has(b: &mut Bench) {
    let dbname = opendb().await;

    let store = IdbStore::new(&dbname).await.unwrap().unwrap();
    let wt = store.write().await.unwrap();
    for i in 0..b.iterations() {
        if i % 2 == 0 {
            wt.put(&format!("{}", i), &random_bytes(512)).await.unwrap();
        }
    }
    wt.commit().await.unwrap();

    b.reset_timer();
    eval(&format!(
        "
        (async _ => {{
            for (let i = 0; i < {}; i++) {{
                await dispatch(\"{}\", \"has\", '{{\"key\": \"' + i + '\"}}');
            }}
        }})()",
        b.iterations(),
        dbname
    ))
    .await;
}

#[wasm_bench]
async fn get1024(b: &mut Bench) {
    get(b, 1024).await
}

#[wasm_bench]
async fn get4096(b: &mut Bench) {
    get(b, 4 * 1024).await
}

#[wasm_bench]
async fn get16384(b: &mut Bench) {
    get(b, 16 * 1024).await
}

async fn get(b: &mut Bench, size: u64) {
    let dbname = opendb().await;

    let store = IdbStore::new(&dbname).await.unwrap().unwrap();
    let wt = store.write().await.unwrap();
    for i in 0..b.iterations() {
        if i % 2 == 0 {
            wt.put(&format!("{}", i), &random_bytes(size))
                .await
                .unwrap();
        }
    }
    wt.commit().await.unwrap();

    b.bytes = size;
    b.reset_timer();
    eval(&format!(
        "
        (async _ => {{
            for (let i = 0; i < {}; i++) {{
                await dispatch(\"{}\", \"get\", '{{\"key\": \"' + i + '\"}}');
            }}
        }})()",
        b.iterations(),
        dbname
    ))
    .await;
}

#[wasm_bench]
async fn put1024(b: &mut Bench) {
    put(b, 1024).await
}

#[wasm_bench]
async fn put4096(b: &mut Bench) {
    put(b, 4 * 1024).await
}

#[wasm_bench]
async fn put16384(b: &mut Bench) {
    put(b, 16 * 1024).await
}

// TODO(nate): Expand to multiple puts in a transaction once that's possible.
async fn put(b: &mut Bench, size: u64) {
    let dbname = opendb().await;

    b.bytes = size;
    b.reset_timer();
    eval(&format!(
        "
        (async _ => {{
            var array = new Uint8Array({});
            for (let i = 0; i < {}; i++) {{
                window.crypto.getRandomValues(array);
                await dispatch(\"{}\", \"put\", '{{\"key\": \"' + i + '\", \"value\": \"' + array.toString().substring(0, {}) + '\"}}');
            }}
        }})()",
        size,
        b.iterations(),
        dbname,
        size
    )).await
}

#[wasm_bench]
async fn random4096(b: &mut Bench) {
    let size = 4096;
    b.bytes = size;
    eval(&format!(
        "
        (async _ => {{
            var array = new Uint8Array({});
            for (let i = 0; i < {}; i++) {{
                window.crypto.getRandomValues(array);
                let bytes = array.toString().substring(0, {});
            }}
        }})()",
        size,
        b.iterations(),
        size,
    ))
    .await
}
