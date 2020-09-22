use std::fmt::Debug;

// Convenience function to get the debug format of anything.
pub fn to_debug<T: Debug>(thing: T) -> String {
    format!("{:?}", thing)
}
