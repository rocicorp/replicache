use crate::kv::idbstore::IdbStore;
use crate::kv::Store;
use futures::stream::{FuturesUnordered, StreamExt};
use rand::Rng;
use wasm_bench::*;

fn rand_bytes(len: usize) -> Vec<u8> {
    (0..len).map(|_| rand::random::<u8>()).collect()
}

fn rand_string(len: usize) -> String {
    let mut rng = rand::thread_rng();
    std::iter::repeat(())
        .map(|_| rng.sample(rand::distributions::Alphanumeric))
        .take(len)
        .collect()
}

#[wasm_bench]
async fn read1x256(b: &mut Bench) {
    read1x(b, 256).await
}

#[wasm_bench]
async fn read1x1024(b: &mut Bench) {
    read1x(b, 1024).await
}

#[wasm_bench]
async fn read1x4096(b: &mut Bench) {
    read1x(b, 4 * 1024).await
}

#[wasm_bench]
async fn read1x16384(b: &mut Bench) {
    read1x(b, 16 * 1024).await
}

#[wasm_bench]
async fn read1x65536(b: &mut Bench) {
    read1x(b, 64 * 1024).await
}

async fn read1x(b: &mut Bench, size: u64) {
    let store = IdbStore::new(&rand_string(12)[..]).await.unwrap().unwrap();

    let n = b.iterations() as usize;
    let mut keys = Vec::with_capacity(n);
    for _ in 0..n {
        keys.push(rand_string(12));
    }
    let bytes = rand_bytes(size as usize);

    let wt = store.write().await.unwrap();
    for i in 0..n {
        wt.put(&keys[i], &bytes).await.unwrap();
    }
    wt.commit().await.unwrap();

    let rt = store.read().await.unwrap();
    b.bytes = size;
    b.reset_timer();
    for i in 0..n {
        rt.get(&keys[i]).await.unwrap();
    }
}

#[wasm_bench]
async fn read4x4096(b: &mut Bench) {
    read(b, 4, 4 * 1024).await
}

#[wasm_bench]
async fn read16x4096(b: &mut Bench) {
    read(b, 16, 4 * 1024).await
}

#[wasm_bench]
async fn read64x4096(b: &mut Bench) {
    read(b, 64, 4 * 1024).await
}

async fn read(b: &mut Bench, concurrency: usize, size: u64) {
    let store = IdbStore::new(&rand_string(12)[..]).await.unwrap().unwrap();

    let n = b.iterations() as usize;
    let mut keys = Vec::with_capacity(n);
    for _ in 0..n {
        keys.push(rand_string(12));
    }
    let bytes = rand_bytes(size as usize);

    let wt = store.write().await.unwrap();
    for i in 0..n {
        wt.put(&keys[i], &bytes).await.unwrap();
    }
    wt.commit().await.unwrap();

    let rt = store.read().await.unwrap();
    b.bytes = size;
    b.reset_timer();

    let mut workers = FuturesUnordered::new();
    let mut i = 0;
    while workers.len() < concurrency && i < n {
        workers.push(rt.get(&keys[i]));
        i += 1;
    }
    loop {
        match workers.next().await {
            Some(_) => {
                if i < n {
                    workers.push(rt.get(&keys[i]));
                    i += 1;
                }
            }
            None => {
                break;
            }
        }
    }
}

#[wasm_bench]
async fn write1x256(b: &mut Bench) {
    write(b, 1, 256).await
}

#[wasm_bench]
async fn write1x4096(b: &mut Bench) {
    write(b, 1, 4 * 1024).await
}

#[wasm_bench]
async fn write4x4096(b: &mut Bench) {
    write(b, 4, 4 * 1024).await
}

#[wasm_bench]
async fn write16x4096(b: &mut Bench) {
    write(b, 16, 4 * 1024).await
}

#[wasm_bench]
async fn write1x65536(b: &mut Bench) {
    write(b, 1, 64 * 1024).await
}

async fn write(b: &mut Bench, writes: usize, size: u64) {
    let store = IdbStore::new(&rand_string(12)[..]).await.unwrap().unwrap();
    let mut n = (b.iterations() as usize / writes) * writes;
    let mut keys = Vec::with_capacity(n);
    for _ in 0..n {
        keys.push(rand_string(12));
    }
    let bytes = rand_bytes(size as usize);

    b.bytes = writes as u64 * size;
    n /= writes;
    b.reset_timer();
    let mut i = 0;
    for _ in 0..n {
        let wt = store.write().await.unwrap();
        for _ in 0..writes {
            wt.put(&keys[i], &bytes).await.unwrap();
            i += 1;
        }
        wt.commit().await.unwrap();
    }
}
