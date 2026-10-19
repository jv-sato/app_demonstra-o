const CACHE_NAME = "sabor-da-casa-sarab-v9";
const CACHE_PREFIX = "sabor-da-casa-sarab-";
const PRECACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./img/menu/1.jpg",
  "./img/menu/2.jpg",
  "./img/menu/3.jpg",
  "./img/menu/4.jpg",
  "./img/menu/5.jpg",
  "./img/menu/6.jpg",
  "./img/menu/7.jpg",
  "./img/menu/8.jpg",
];
const NETWORK_ONLY_HOSTS = [
  "viacep.com.br",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(CACHE_PREFIX) &&
                cacheName !== CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldHandleRequest(request, requestUrl) {
  return (
    request.method === "GET" &&
    requestUrl.origin === self.location.origin &&
    !NETWORK_ONLY_HOSTS.includes(requestUrl.hostname)
  );
}

async function fetchAndCache(request) {
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    if (request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw error;
  }

  if (response.ok) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    } catch (error) {
      console.error("Não foi possível atualizar o cache do aplicativo.", error);
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (!shouldHandleRequest(event.request, requestUrl)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetchAndCache(event.request);
    })
  );
});
