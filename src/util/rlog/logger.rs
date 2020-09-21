use std::fmt;
use str_macro::str;

// LogContext is a low-tech log context. To add context call add_context().
// To pass it around clone() it. If you can't do that then pass its
// context() as a String and call new_from_context() to reconstitute it.
#[derive(Clone, Default)]
pub struct LogContext {
    context: String,
}

impl fmt::Display for LogContext {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.context)
    }
}

impl LogContext {
    pub fn new() -> LogContext {
        LogContext { context: str!("") }
    }

    pub fn new_from_context(context: String) -> LogContext {
        LogContext { context }
    }

    pub fn context(&self) -> &str {
        &self.context
    }

    pub fn add_context(&mut self, key: &str, value: &str) {
        self.context = format!("{}{}={} ", self.context, key, value);
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

// Note: no trace or warn by design!
