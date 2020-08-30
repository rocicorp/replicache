use crate::dag;

pub async fn get_root(store: &dag::Store, head_name: &str) -> Result<String, GetRootError> {
    use GetRootError::*;

    let read = store.read().await.map_err(ReadError)?;
    let head = read
        .read()
        .get_head(head_name)
        .await
        .map_err(GetHeadError)?
        .ok_or(NoHead)?;

    Ok(head)
}

#[derive(Debug, PartialEq)]
pub enum GetRootError {
    ReadError(dag::Error),
    GetHeadError(dag::Error),
    NoHead,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::kv::memstore::MemStore;
    use str_macro::str;

    #[async_std::test]
    async fn get_root() {
        async fn test(head_val: Option<String>, expected: Result<String, GetRootError>) {
            let kvs = MemStore::new();
            let ds = dag::Store::new(Box::from(kvs));
            if let Some(v) = head_val {
                let mut dw = ds.write().await.unwrap();
                dw.set_head(db::DEFAULT_HEAD_NAME, Some(&v)).await.unwrap();
                dw.commit().await.unwrap();
            }
            let actual = super::get_root(&ds, db::DEFAULT_HEAD_NAME).await;
            assert_eq!(expected, actual);
        }

        test(None, Err(GetRootError::NoHead)).await;
        test(Some(str!("foo")), Ok(str!("foo"))).await;
    }
}
