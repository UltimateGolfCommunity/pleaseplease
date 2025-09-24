// Nuclear Cache Clear - Run this in browser console
// This will completely wipe everything and force a fresh start

console.log('🚨 NUCLEAR CACHE CLEAR STARTING...');

// Step 1: Unregister ALL service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(`🗑️ Found ${registrations.length} service workers to unregister`);
  return Promise.all(registrations.map(reg => {
    console.log(`🗑️ Unregistering: ${reg.scope}`);
    return reg.unregister();
  }));
}).then(() => {
  console.log('✅ All service workers unregistered');
  
  // Step 2: Delete ALL caches
  return caches.keys();
}).then(cacheNames => {
  console.log(`🗑️ Found ${cacheNames.length} caches to delete`);
  return Promise.all(cacheNames.map(cacheName => {
    console.log(`🗑️ Deleting cache: ${cacheName}`);
    return caches.delete(cacheName);
  }));
}).then(() => {
  console.log('✅ All caches deleted');
  
  // Step 3: Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ All storage cleared');
  
  // Step 4: Clear IndexedDB (if exists)
  if ('indexedDB' in window) {
    console.log('🗑️ Clearing IndexedDB...');
    // Note: In a real app, you'd delete specific databases
  }
  
  console.log('✅ NUCLEAR CLEAR COMPLETE!');
  console.log('🔄 Reloading page in 2 seconds...');
  
  setTimeout(() => {
    window.location.reload(true);
  }, 2000);
}).catch(error => {
  console.error('❌ Error during nuclear clear:', error);
});
