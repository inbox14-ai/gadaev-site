// Сервис-воркер: открывает плеер без интернета (кэширует страницу и шрифты)
const V='tape-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(['./','./index.html'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tape-v')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const font=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(u.origin!==location.origin&&!font)return;
  e.respondWith(handle(r,font));
});
async function handle(r,font){
  const c=await caches.open(V);
  if(font){
    const x=await c.match(r);if(x)return x;
    try{const n=await fetch(r);c.put(r,n.clone());return n}catch(err){return Response.error()}
  }
  try{
    const n=await Promise.race([fetch(r),new Promise((_,rej)=>setTimeout(rej,4000))]);
    if(n&&n.ok)c.put(r,n.clone());
    return n;
  }catch(err){
    const x=await c.match(r,{ignoreSearch:true})||await c.match('./index.html');
    return x||Response.error();
  }
}
