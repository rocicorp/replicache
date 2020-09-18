use log::{debug, error, info};

// Logger is a low-tech context logger. To add context call add_context().
// To pass it around clone() it. If you can't do that then pass its
// context() as a String and call new_from_context() to reconstitute it.
//
// TODO support dynamically setting log level here.
#[derive(Clone)]
pub struct Logger {
    context: String,
}

// Short, convenience method for tests to instantiate a new logger when
// they don't care about passing context around.
pub fn log() -> Logger {
    Logger::new()
}

impl Logger {
    pub fn new() -> Logger {
        Logger {
            context: "".to_string(),
        }
    }

    pub fn new_from_context(context: String) -> Logger {
        Logger { context }
    }

    pub fn add_context(&mut self, key: &str, value: &str) {
        self.context = format!("{}{}={} ", self.context, key, value);
    }

    pub fn context(&self) -> String {
        self.context.clone()
    }

    // TODO these functions should not force the caller to use format!() before
    // calling them. We should replace these with macros that call format!().
    pub fn debug(&self, msg: String) {
        debug!("{}{}", self.context, msg);
    }

    pub fn info(&self, msg: String) {
        info!("{}{}", self.context, msg);
    }

    pub fn error(&self, msg: String) {
        error!("{}{}", self.context, msg);
    }

    // Note: no trace or warn by design!
}

// Clippy complains if we don't have this.
impl Default for Logger {
    fn default() -> Self {
        Self::new()
    }
}
