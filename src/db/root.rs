use crate::dag;
use crate::util::rlog::LogContext;

pub async fn get_root(
    store: &dag::Store,
    head_name: &str,
    lc: LogContext,
) -> Result<String, GetRootError> {
    use GetRootError::*;

    let read = store.read(lc).await.map_err(ReadError)?;
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
    use crate::util::rlog::LogContext;
    use str_macro::str;

    #[async_std::test]
    async fn get_root() {
        async fn test(head_val: Option<String>, expected: Result<String, GetRootError>) {
            let kvs = MemStore::new();
            let ds = dag::Store::new(Box::from(kvs));
            if let Some(v) = head_val {
                let dw = ds.write(LogContext::new()).await.unwrap();
                dw.set_head(db::DEFAULT_HEAD_NAME, Some(&v)).await.unwrap();
                dw.commit().await.unwrap();
            }
            let actual = super::get_root(&ds, db::DEFAULT_HEAD_NAME, LogContext::new()).await;
            assert_eq!(expected, actual);
        }

        test(None, Err(GetRootError::NoHead)).await;
        test(Some(str!("foo")), Ok(str!("foo"))).await;
    }
}
