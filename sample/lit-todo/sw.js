/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v1';

const NETWORK_WHITELIST = [
  'https://serve.replicache.dev/pull',
  'https://replicache-sample-todo.now.sh/serve/replicache-batch',
];

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/',
  'index.html',
  'styles.css',
  'replicache-logo.png',
  'material-icons.woff2',
  'roboto.woff2',
  'roboto-medium.woff2',
  'output/main.js',
  'output/replicache.wasm',
  'https://js.pusher.com/7.0/pusher.min.js',
];

// Force new SW versions to become active immediately instead of waiting for
// connected clients to close.
self.addEventListener('install', event => {
  console.info('new sw installed');
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

// Force reload clients when new sw is activated. This is not fantastic, but
// simple and easy for a demo.
//
// In combination with above, this has the effect of immediately force-reloading
// the app as soon as a new version of the sw is discovered.
self.addEventListener('activate', event => {
  console.info('new sw activating');
  event.waitUntil(
    self.clients
      .claim()
      .then(() => {
        return self.clients.matchAll({type: 'window'});
      })
      .then(clients => {
        return clients.map(client => {
          console.info('reloading client', client.url);
          return client.navigate(client.url);
        });
      }),
  );
});

function precache() {
  return caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS));
}

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      } else if (NETWORK_WHITELIST.indexOf(event.request.url) > -1) {
        return fetch(event.request);
      } else {
        return new Response('404: 😢🐼', {status: 404});
      }
    }),
  );

  if (
    event.request.url == self.location.origin + '/' ||
    event.request.url == self.location.origin + '/index.html'
  ) {
    precache();
  }
});
