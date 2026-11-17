const CACHE_NAME = 'lotto-app-cache-v2'; // ভার্সন বাড়ানো হলো

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // পেজ নেভিগেশন বা HTML ফাইলের রিকোয়েস্ট হলে
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 🌟 যদি সার্ভার 404 দেয় (মানে ডিপ্লয় চলছে), ক্যাশ থেকে আগের পেজ দাও
          if (response.status === 404) {
            return caches.match(event.request).then((cachedResponse) => {
              return cachedResponse || response;
            });
          }
          // সব ঠিক থাকলে ক্যাশে সেভ করো
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // ইন্টারনেট না থাকলে ক্যাশ থেকে দাও
          return caches.match(event.request);
        })
    );
  } else {
    // অন্যান্য ফাইল (CSS, JS, ইমেজ) এর জন্য সাধারণ ক্যাশ লজিক
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});
