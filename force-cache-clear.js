// Force Clear All Caches and Service Worker
// Run this in browser console to completely clear everything

console.log('🧹 FORCE CLEARING ALL CACHES AND SERVICE WORKER...');

// 1. Unregister all service workers
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  console.log('🗑️ Found', registrations.length, 'service worker registrations');
  for(let registration of registrations) {
    console.log('🗑️ Unregistering:', registration.scope);
    registration.unregister();
  }
});

// 2. Clear all caches
caches.keys().then(function(cacheNames) {
  console.log('🗑️ Found', cacheNames.length, 'caches to delete');
  return Promise.all(
    cacheNames.map(function(cacheName) {
      console.log('🗑️ Deleting cache:', cacheName);
      return caches.delete(cacheName);
    })
  );
}).then(function() {
  console.log('✅ All caches cleared!');
});

// 3. Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();
console.log('🗑️ Local storage cleared');

// 4. Reload the page
setTimeout(() => {
  console.log('🔄 Reloading page in 2 seconds...');
  window.location.reload(true);
}, 2000);

console.log('✅ Cache clearing process started!');
