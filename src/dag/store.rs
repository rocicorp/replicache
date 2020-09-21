use super::read::OwnedRead;
use super::write::Write;
use super::Result;
use crate::kv;
use crate::util::rlog::LogContext;

pub struct Store {
    kv: Box<dyn kv::Store>,
}

impl Store {
    pub fn new(kv: Box<dyn kv::Store>) -> Store {
        Store { kv }
    }

    pub async fn read(&self, lc: LogContext) -> Result<OwnedRead<'_>> {
        Ok(OwnedRead::new(self.kv.read(lc).await?))
    }

    pub async fn write(&self, lc: LogContext) -> Result<Write<'_>> {
        Ok(Write::new(self.kv.write(lc).await?))
    }

    pub async fn close(&self) {
        self.kv.close().await;
    }
}
