package tests

import "errors"
import "unsafe"

// #cgo LDFLAGS: -L${SRCDIR}/../target/debug -lreplicache_client
// void dispatch(const char* db_name, const char *rpc, const char *args, char **response, char **error);
// void free_ptr(char* ptr);
// size_t strlen(const char *s);
import "C"

func Dispatch(db_name, rpc string, args []byte) ([]byte, error) {
	var resultp *C.char = nil
	var errp *C.char = nil

	C.dispatch(C.CString(db_name), C.CString(rpc), (*C.char)(C.CBytes(args)), &resultp, &errp)
	result := []byte{}
	if resultp != nil {
		result = C.GoBytes(unsafe.Pointer(resultp), C.int(C.strlen(resultp)))
		C.free_ptr(resultp)
	}
	if errp != nil {
		err := errors.New(C.GoString(errp))
		C.free_ptr(errp)
		return nil, err
	}
	return result, nil
}
