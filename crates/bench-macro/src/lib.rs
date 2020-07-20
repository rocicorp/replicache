// This source file is based on
// https://github.com/rustwasm/wasm-bindgen/blob/master/crates/test/src/lib.rs,
// which is Copyright (c) 2014 Alex Crichton, and is dual licensed under the
// MIT and Apache licenses. Various changes have been made to adapt that code
// to the use case here of supporting asynchronous benchmarks under wasm, and
// all such changes are copyrighted and licensed separately.
//
// Text of the MIT license from wasm-bindgen, for completeness:
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

extern crate proc_macro;

use proc_macro2::*;
use quote::quote;
use std::sync::atomic::*;

static CNT: AtomicUsize = AtomicUsize::new(0);

#[proc_macro_attribute]
pub fn wasm_bench(
    attr: proc_macro::TokenStream,
    body: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
    let mut attr = attr.into_iter();
    while let Some(_) = attr.next() {
        match &attr.next() {
            Some(proc_macro::TokenTree::Punct(op)) if op.as_char() == ',' => {}
            Some(_) => panic!("malformed `#[wasm_bench]` attribute"),
            None => break,
        }
    }

    let mut body = TokenStream::from(body).into_iter();

    // Skip over other attributes to `fn #ident ...`, and extract `#ident`
    let mut leading_tokens = Vec::new();
    while let Some(token) = body.next() {
        leading_tokens.push(token.clone());
        if let TokenTree::Ident(token) = token {
            if token == "fn" {
                break;
            }
        }
    }
    let ident = find_ident(&mut body).expect("expected a function name");

    // We generate a `#[no_mangle]` with a known prefix so the test harness can
    // later slurp up all of these functions and pass them as arguments to the
    // main test harness. This is the entry point for all tests.
    let name = format!("__wbgt_{}_{}", ident, CNT.fetch_add(1, Ordering::SeqCst));
    let name = Ident::new(&name, Span::call_site());
    let wrapper_name = Ident::new(&format!("{}_wrapper", ident), Span::call_site());
    let mut tokens = Vec::<TokenTree>::new();
    tokens.extend(
        (quote! {
            #[no_mangle]
            pub extern "C" fn #name(cx: &::wasm_bindgen_test::__rt::Context) {
                let test_name = concat!(module_path!(), "::", stringify!(#ident));
                crate::wasm::init_console_log();
                cx.execute_async(test_name, #wrapper_name);
            }

            async fn #wrapper_name() {
                let mut module_path = module_path!();
                let name: String = stringify!(#ident).into();
                let index = module_path.find("::").unwrap();
                module_path = &module_path[index + 2..];
                let test_name = match module_path.find("::") {
                    Some(index) => format!("{}::{}", &module_path[index + 2..], name),
                    None => name,
                };
                benchmark(&test_name, #ident).await;
            }
        })
        .into_iter(),
    );

    tokens.extend(leading_tokens);
    tokens.push(ident.into());
    tokens.extend(body);

    tokens.into_iter().collect::<TokenStream>().into()
}

fn find_ident(iter: &mut token_stream::IntoIter) -> Option<Ident> {
    match iter.next()? {
        TokenTree::Ident(i) => Some(i),
        TokenTree::Group(g) if g.delimiter() == Delimiter::None => {
            find_ident(&mut g.stream().into_iter())
        }
        _ => None,
    }
}
