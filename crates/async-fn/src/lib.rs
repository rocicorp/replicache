// Workaround for async function pointers taking references from
// https://github.com/rustasync/team/issues/19#issuecomment-515051308.

use std::future::Future;

macro_rules! impl_async_fn {
    ($(($FnOnce:ident, $FnMut:ident, $Fn:ident, ($($arg:ident: $arg_ty:ident,)*)),)*) => {
        $(
            pub trait $FnOnce<$($arg_ty,)*> {
                type Output;
                type Future: Future<Output = Self::Output>;
                fn call_once(self, $($arg: $arg_ty,)*) -> Self::Future;
            }
            pub trait $FnMut<$($arg_ty,)*>: $FnOnce<$($arg_ty,)*> {
                fn call_mut(&mut self, $($arg: $arg_ty,)*) -> Self::Future;
            }
            pub trait $Fn<$($arg_ty,)*>: $FnMut<$($arg_ty,)*> {
                fn call(&self, $($arg: $arg_ty,)*) -> Self::Future;
            }
            impl<$($arg_ty,)* F, Fut> $FnOnce<$($arg_ty,)*> for F
            where
                F: FnOnce($($arg_ty,)*) -> Fut,
                Fut: Future,
            {
                type Output = Fut::Output;
                type Future = Fut;
                fn call_once(self, $($arg: $arg_ty,)*) -> Self::Future {
                    self($($arg,)*)
                }
            }
            impl<$($arg_ty,)* F, Fut> $FnMut<$($arg_ty,)*> for F
            where
                F: FnMut($($arg_ty,)*) -> Fut,
                Fut: Future,
            {
                fn call_mut(&mut self, $($arg: $arg_ty,)*) -> Self::Future {
                    self($($arg,)*)
                }
            }
            impl<$($arg_ty,)* F, Fut> $Fn<$($arg_ty,)*> for F
            where
                F: Fn($($arg_ty,)*) -> Fut,
                Fut: Future,
            {
                fn call(&self, $($arg: $arg_ty,)*) -> Self::Future {
                    self($($arg,)*)
                }
            }
        )*
    }
}

impl_async_fn! {
    (AsyncFnOnce0, AsyncFnMut0, AsyncFn0, ()),
    (AsyncFnOnce1, AsyncFnMut1, AsyncFn1, (a0:A0, )),
    (AsyncFnOnce2, AsyncFnMut2, AsyncFn2, (a0:A0, a1:A1, )),
    (AsyncFnOnce3, AsyncFnMut3, AsyncFn3, (a0:A0, a1:A1, a2:A2, )),
    (AsyncFnOnce4, AsyncFnMut4, AsyncFn4, (a0:A0, a1:A1, a2:A2, a3:A3, )),
    (AsyncFnOnce5, AsyncFnMut5, AsyncFn5, (a0:A0, a1:A1, a2:A2, a3:A3, a4:A4, )),
    (AsyncFnOnce6, AsyncFnMut6, AsyncFn6, (a0:A0, a1:A1, a2:A2, a3:A3, a4:A4, a5:A5, )),
}
