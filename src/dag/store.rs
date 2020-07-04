use crate::kv;
use super::Result;
use super::read::Read;
use super::write::Write;

#[allow(dead_code)]
pub struct Store {
    kv: Box<dyn kv::Store>,
}

#[allow(dead_code)]
impl Store {
    pub fn new(kv: Box<dyn kv::Store>) -> Store {
        Store{kv}
    }

    pub async fn read<'a>(&'a self) -> Result<Read<'a>> {
        Ok(Read::new(self.kv.read().await?))
    }

    pub async fn write<'a>(&'a mut self) -> Result<Write<'a>> {
        Ok(Write::new(self.kv.write().await?))
    }
}
