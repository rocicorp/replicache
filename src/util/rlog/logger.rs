use log::error as raw_log_error;
use std::fmt;
use std::sync::Arc;
use std::sync::RwLock;
use str_macro::str;

// LogContext is a lightweight, low-tech logging context. To add context
// call add_context(). Pass it around by clone()ing it. Note that the context
// is shared between all holders of an instance.
//
// Note that LogContext is Send and Sync. It needs to be Sync because
// the SENDER lazy_static in dispatch requires it (otherwise we could use
// the cheaper Rc<RefCell>).
pub struct LogContext(Arc<RwLock<String>>);

impl LogContext {
    pub fn new() -> LogContext {
        LogContext::new_from_context(str!(""))
    }

    pub fn new_from_context(context: String) -> LogContext {
        LogContext(Arc::new(RwLock::new(context)))
    }

    pub fn add_context(&self, key: &str, value: &str) {
        match self.0.write() {
            Ok(mut guard) => {
                let new = format!("{}{}={} ", *guard, key, value);
                *guard = new;
            }
            Err(err) => {
                raw_log_error!("LogContext lock poisoned: {:?}", err);
            }
        }
    }
}

impl fmt::Display for LogContext {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self.0.read() {
            Ok(guard) => write!(f, "{}", *guard),
            Err(err) => {
                raw_log_error!("LogContext lock poisoned: {:?}", err);
                write!(f, "<internal error (poisoned LogContext lock)> ")
            }
        }
    }
}

impl Clone for LogContext {
    fn clone(&self) -> Self {
        LogContext(self.0.clone())
    }
}

// Appease Clippy, our wrathful and angry god.
impl Default for LogContext {
    fn default() -> Self {
        Self::new()
    }
}

macro_rules! log_impl {
    ($target:expr, $context:expr, $($arg:tt)*) => ({
        if $target <= log::max_level() {
            log::log!($target, "{}{}", $context, format!($($arg)+));
        }
    })
}

macro_rules! error {
    ($context:expr, $($arg:tt)*) => ({
        log_impl!(log::Level::Error, $context, $($arg)+);
    })
}

#[allow(unused_macros)]
macro_rules! info {
    ($context:expr, $($arg:tt)*) => ({
        log_impl!(log::Level::Info, $context, $($arg)+);
    })
}

macro_rules! debug {
    ($context:expr, $($arg:tt)*) => ({
        log_impl!(log::Level::Debug, $context, $($arg)+);
    })
}

// Note: no trace or warn by design:
// https://github.com/rocicorp/replicache/blob/master/contributing.md#style-general

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_context() {
        let lc = LogContext::new();
        assert_eq!("", format!("{}", lc).as_str());
        lc.add_context("foo", "bar");
        assert_eq!("foo=bar ", format!("{}", lc).as_str());
        lc.add_context("bar", "baz");
        assert_eq!("foo=bar bar=baz ", format!("{}", lc).as_str());

        let lc2 = lc.clone();
        assert_eq!("foo=bar bar=baz ", format!("{}", lc2).as_str());
        lc2.add_context("shared", "yes");
        assert_eq!("foo=bar bar=baz shared=yes ", format!("{}", lc2).as_str());
        assert_eq!("foo=bar bar=baz shared=yes ", format!("{}", lc).as_str());
    }
}
