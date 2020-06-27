pub type Key = String;

#[allow(dead_code)]
pub struct Chunk {
    pub key: Key,
    buf: Vec<u8>,
    refs: [Key],
}
