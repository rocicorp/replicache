use super::read::OwnedRead;
use super::write::Write;
use super::Result;
use crate::kv;
use crate::util::rlog;

pub struct Store {
    kv: Box<dyn kv::Store>,
}

impl Store {
    pub fn new(kv: Box<dyn kv::Store>) -> Store {
        Store { kv }
    }

    pub async fn read(&self, logger: rlog::Logger) -> Result<OwnedRead<'_>> {
        Ok(OwnedRead::new(self.kv.read(logger).await?))
    }

    pub async fn write(&self, logger: rlog::Logger) -> Result<Write<'_>> {
        Ok(Write::new(self.kv.write(logger).await?))
    }

    pub async fn close(&self) {
        self.kv.close().await;
    }
}
