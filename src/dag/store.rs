use super::read::OwnedRead;
use super::write::Write;
use super::Result;
use crate::kv;

pub struct Store {
    kv: Box<dyn kv::Store>,
}

impl Store {
    pub fn new(kv: Box<dyn kv::Store>) -> Store {
        Store { kv }
    }

    pub async fn read(&self) -> Result<OwnedRead<'_>> {
        Ok(OwnedRead::new(self.kv.read().await?))
    }

    pub async fn write(&self) -> Result<Write<'_>> {
        Ok(Write::new(self.kv.write().await?))
    }
}
