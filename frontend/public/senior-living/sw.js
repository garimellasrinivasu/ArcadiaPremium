// Anubandham service worker · build 20261007-1257-045feb6b
const C="anubandham-20261007-1257-045feb6b";
const A=["./","index.html","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:"reload"})))));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
 const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
 // Network first: phones always get the newest version when online; saved copy only when offline
 e.respondWith(fetch(r,{cache:"no-store"}).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{});return res;})
  .catch(()=>caches.match(r).then(m=>m||(r.mode==="navigate"?caches.match("index.html"):undefined))));
});
