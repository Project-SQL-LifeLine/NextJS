const CACHE_NAME = 'lotto-app-cache-v1';

// পেজ লোড হওয়ার সময় ফাইলগুলো ক্যাশে সেভ করবে
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// নতুন সাইট ডিপ্লয় হলে পুরনো ক্যাশ মুছে ফেলবে
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

// নেটওয়ার্ক চেক করবে, না পেলে ক্যাশ থেকে দেখাবে (এটাই মূল লজিক)
self.addEventListener('fetch', (event) => {
  // শুধুমাত্র GET রিকোয়েস্টের জন্য কাজ করবে
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // রেসপন্স সফল হলে (404 না হলে) ক্যাশে সেভ করবে
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // নেটওয়ার্ক ফেইল করলে বা 404 আসলে ক্যাশ থেকে আগের পেজ দেখাবে
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
        });
      })
  );
});
