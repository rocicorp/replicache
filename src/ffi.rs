use crate::embed;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr::null_mut;
use std::sync::Once;

static INIT: Once = Once::new();

pub fn init_log() {
    INIT.call_once(env_logger::init);
}

#[no_mangle]
pub extern "C" fn dispatch(
    db_name: *const c_char,
    rpc: *const c_char,
    args: *const c_char,
    response: *mut *mut c_char,
    error: *mut *mut c_char,
) {
    init_log();
    unsafe {
        *response = null_mut();
        *error = null_mut();
    }

    let err = move |msg| unsafe {
        *error = CString::new(msg).unwrap().into_raw();
    };

    if db_name.is_null() {
        return err("db_name is null");
    }
    let db_name = unsafe { CStr::from_ptr(db_name) };
    let db_name = match db_name.to_str() {
        Err(e) => return err(&format!("db_name invalid: {}", e)),
        Ok(v) => v,
    };

    if rpc.is_null() {
        return err("rpc is null");
    }
    let rpc = unsafe { CStr::from_ptr(rpc) };
    let rpc = match rpc.to_str() {
        Err(e) => return err(&format!("rpc invalid: {}", e)),
        Ok(v) => v,
    };

    if args.is_null() {
        return err("args is null");
    }
    let args = unsafe { CStr::from_ptr(args) };
    let args = match args.to_str() {
        Err(e) => return err(&format!("args invalid: {}", e)),
        Ok(v) => v,
    };

    match async_std::task::block_on(embed::dispatch(
        db_name.to_string(),
        rpc.to_string(),
        args.to_string(),
    )) {
        Ok(v) => unsafe {
            *response = CString::new(v).unwrap().into_raw();
        },
        Err(e) => unsafe {
            *error = CString::new(e).unwrap().into_raw();
        },
    }
}

#[no_mangle]
pub extern "C" fn free_ptr(ptr: *mut c_char) {
    unsafe {
        let _ = CString::from_raw(ptr);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CString;
    use std::ptr::null;

    // dispatch converts Rust-like args to what's expected for the FFI
    // interface and translates back to ease calls.
    fn dispatch(db_name: &str, rpc: &str, args: &str) -> Result<String, String> {
        let mut response: *mut c_char = null_mut();
        let mut error: *mut c_char = null_mut();
        super::dispatch(
            CString::new(db_name).unwrap().as_ptr(),
            CString::new(rpc).unwrap().as_ptr(),
            CString::new(args).unwrap().as_ptr(),
            &mut response,
            &mut error,
        );

        unsafe {
            if error != null_mut() {
                Err(CString::from_raw(error).to_str().unwrap().into())
            } else {
                Ok(CString::from_raw(response).to_str().unwrap().into())
            }
        }
    }

    fn dispatch_error(db_name: *const c_char, rpc: *const c_char, args: *const c_char, msg: &str) {
        let mut response: *mut c_char = null_mut();
        let mut error: *mut c_char = null_mut();
        super::dispatch(db_name, rpc, args, &mut response, &mut error);
        assert_eq!(response, null_mut());
        assert_eq!(msg, unsafe { CString::from_raw(error).to_str().unwrap() });
    }

    #[test]
    fn test_dispatch() {
        init_log();

        assert_eq!("", &dispatch("mem", "open", "").unwrap());
        assert_eq!("[\"mem\"]", &dispatch("", "debug", "open_dbs").unwrap());

        let empty = CString::new("").unwrap();
        let empty_ptr = empty.as_ptr();
        let invalid = unsafe { CStr::from_bytes_with_nul_unchecked(&[128u8, 0u8]).as_ptr() };

        dispatch_error(null(), empty_ptr, empty_ptr, "db_name is null");
        dispatch_error(
            invalid,
            empty_ptr,
            empty_ptr,
            "db_name invalid: invalid utf-8 sequence of 1 bytes from index 0",
        );

        dispatch_error(empty_ptr, null(), empty_ptr, "rpc is null");
        dispatch_error(
            empty_ptr,
            invalid,
            empty_ptr,
            "rpc invalid: invalid utf-8 sequence of 1 bytes from index 0",
        );

        dispatch_error(empty_ptr, empty_ptr, null(), "args is null");
        dispatch_error(
            empty_ptr,
            empty_ptr,
            invalid,
            "args invalid: invalid utf-8 sequence of 1 bytes from index 0",
        );

        dispatch_error(empty_ptr, empty_ptr, empty_ptr, "\"\" not open");
        assert_eq!(
            "Unsupported rpc name noexist",
            &dispatch("mem", "noexist", "").unwrap_err()
        );

        assert_eq!("", &dispatch("mem", "close", "").unwrap());
        assert_eq!("[]", &dispatch("", "debug", "open_dbs").unwrap());
    }
}
