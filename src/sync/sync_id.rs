use crate::util::uuid;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use str_macro::str;

lazy_static! {
    static ref SESSION_ID: String = {
        let mut randoms: [u8; 4] = [0; 4];
        let _ = uuid::make_random_numbers(&mut randoms);
        format!(
            "{:x}{:x}{:x}{:x}",
            randoms[0], randoms[1], randoms[2], randoms[3]
        )
    };
    static ref SYNC_COUNTERS: Mutex<HashMap<String, AtomicU32>> = Mutex::new(HashMap::new());
}

// new() returns a new syncid of the form <clientid>-<sessionid>-<sync count>.
// The sync count enables one to find the sync following or preceeding a given
// sync. The sessionid scopes the sync count, ensuring the syncid is
// probabilistically unique across restarts (which is good enough).
pub fn new(client_id: &str) -> String {
    let mut map = match SYNC_COUNTERS.lock() {
        Err(e) => {
            error!("", "error getting sync count: {:?}", e);
            return str!("busted-sync-counter");
        }
        Ok(m) => m,
    };
    let counter = match map.get(client_id) {
        None => {
            let counter = AtomicU32::new(0);
            map.insert(client_id.into(), counter);
            map.get(client_id).unwrap()
        }
        Some(c) => c,
    };
    let n = counter.fetch_add(1, Ordering::Relaxed);
    format!("{}-{}-{}", client_id, *SESSION_ID, n)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[async_std::test]
    async fn test_new() {
        use regex::Regex;

        let re = Regex::new(r"client-[0-9a-f]+-0$").unwrap();
        let got = &new("client");
        assert!(re.is_match(got), "{} doesn't match {:?}", got, re);
        let re = Regex::new(r"client-[0-9a-f]+-1$").unwrap();
        let got = &new("client");
        assert!(re.is_match(got), "{} doesn't match {:?}", got, re);
    }
}
