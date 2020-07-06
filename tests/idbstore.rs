pub mod idbstore {

    use rand::Rng;
    use replicache_client::kv::Store;
    use replicache_client::wasm;
    use wasm_bindgen_test::wasm_bindgen_test_configure;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    async fn new_store() -> Box<dyn Store> {
        let mut rng = rand::thread_rng();
        let name = std::iter::repeat(())
            .map(|()| rng.sample(rand::distributions::Alphanumeric))
            .take(12)
            .collect();
        wasm::new_idbstore(name)
            .await
            .expect("IdbStore::new failed")
    }

    // TODO(nate): Test entering Errored state.

    #[wasm_bindgen_test]
    async fn simple_commit() {
        let store = new_store().await;

        // Start a write transaction, and put a value on it.
        let wt = store.write().await.unwrap();
        assert_eq!(false, wt.has("bar").await.unwrap());
        wt.put("bar", b"baz").await.unwrap();
        assert_eq!(Some(b"baz".to_vec()), wt.get("bar").await.unwrap());
        wt.commit().await.unwrap();

        // Verify that the write was effective.
        let rt = store.read().await.unwrap();
        assert_eq!(true, rt.has("bar").await.unwrap());
        assert_eq!(Some(b"baz".to_vec()), rt.get("bar").await.unwrap());
    }

    #[wasm_bindgen_test]
    async fn delete() {
        let store = new_store().await;

        // Start a write transaction, and put a value on it.
        let wt = store.write().await.unwrap();
        assert_eq!(false, wt.has("bar").await.unwrap());
        wt.put("bar", b"baz").await.unwrap();
        wt.commit().await.unwrap();

        // Delete.
        let wt = store.write().await.unwrap();
        assert_eq!(true, wt.has("bar").await.unwrap());
        wt.del("bar").await.unwrap();
        assert_eq!(false, wt.has("bar").await.unwrap());
        wt.commit().await.unwrap();

        // Verify that the delete was effective.
        let rt = store.read().await.unwrap();
        assert_eq!(false, rt.has("bar").await.unwrap());
        assert_eq!(None, rt.get("bar").await.unwrap());
    }

    #[wasm_bindgen_test]
    async fn read_only_commit() {
        let store = new_store().await;

        let wt = store.write().await.unwrap();
        assert_eq!(false, wt.has("bar").await.unwrap());
        wt.commit().await.unwrap();
    }

    #[wasm_bindgen_test]
    async fn read_only_rollback() {
        let store = new_store().await;

        let wt = store.write().await.unwrap();
        assert_eq!(false, wt.has("bar").await.unwrap());
        wt.rollback().await.unwrap();
    }

    #[wasm_bindgen_test]
    async fn simple_rollback() {
        let store = new_store().await;

        // Start a write transaction and put a value, then abort.
        let wt = store.write().await.unwrap();
        wt.put("bar", b"baz").await.unwrap();
        wt.rollback().await.unwrap();

        let rt = store.read().await.unwrap();
        assert_eq!(None, rt.get("bar").await.unwrap());
    }

    #[wasm_bindgen_test]
    async fn autocommit_rolls_back() {
        let store = new_store().await;
        let rt = store.read().await.unwrap();
        assert_eq!(false, rt.has("bar").await.unwrap());

        // Start a write transaction and put a value.
        let wt = store.write().await.unwrap();
        wt.put("bar", b"baz").await.unwrap();

        // Start a read transaction and verify isolation.
        let rt = store.read().await.unwrap();
        assert_eq!(None, rt.get("bar").await.unwrap());

        // Verify that attempts to commit will now fail, and the put was lost.
        assert!(wt.commit().await.is_err());
        let rt = store.read().await.unwrap();
        assert_eq!(None, rt.get("bar").await.unwrap());
    }

    #[wasm_bindgen_test]
    async fn autocommit_rollback_succeeds() {
        let store = new_store().await;
        let rt = store.read().await.unwrap();
        assert_eq!(false, rt.has("bar").await.unwrap());

        // Start a write transaction and put a value.
        let wt = store.write().await.unwrap();
        wt.put("bar", b"baz").await.unwrap();

        // Start a read transaction and verify isolation.
        let rt = store.read().await.unwrap();
        assert_eq!(None, rt.get("bar").await.unwrap());

        // Verify that an attempted rollback succeeds, and the put was lost.
        wt.rollback().await.unwrap();
        let rt = store.read().await.unwrap();
        assert_eq!(None, rt.get("bar").await.unwrap());
    }
}
