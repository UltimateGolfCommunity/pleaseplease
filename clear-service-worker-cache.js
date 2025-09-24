// Clear Service Worker Cache Script
// Run this in your browser's console to clear the service worker cache

console.log('🧹 Clearing service worker cache...');

// Method 1: Unregister service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🗑️ Unregistering service worker:', registration.scope);
      registration.unregister();
    }
  });
}

// Method 2: Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('✅ All caches cleared!');
    console.log('🔄 Please refresh the page to see fresh data');
  });
}

// Method 3: Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();
console.log('🗑️ Local storage cleared');

console.log('✅ Service worker cache clearing complete!');
console.log('🔄 Please hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
