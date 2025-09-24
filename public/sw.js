// Service Worker for Ultimate Golf Community PWA
const CACHE_NAME = 'ugc-golf-v2-cache-bypass';
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/auth/signup',
  '/manifest.json',
  '/logos/NEWLOGOREAL.png',
  '/logos/golfcoursedefaultimage.png',
  '/logos/augustanational.png',
  '/logos/Pebblebeach.png',
  '/logos/woodmont.png',
  '/logos/arrowhead.png',
  '/logos/hermitagegolfcourse.jpeg',
  '/logos/Mccabe.png',
  '/logos/bandonlogo.jpeg',
  '/logos/bethpagelogo.png',
  '/logos/carnoustielogo.png',
  '/logos/chambersbay.svg',
  '/logos/streamsonglogo.png',
  '/logos/TedRhodeslogo.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Don't cache tee times API - always fetch fresh
  if (event.request.url.includes('/api/tee-times')) {
    console.log('🚫 BYPASSING CACHE for tee times API:', event.request.url);
    console.log('🚫 Service Worker Version:', CACHE_NAME);
    
    // Clear any existing cache for this URL
    caches.delete(event.request.url);
    
    // Always fetch fresh from network
    event.respondWith(
      fetch(event.request, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).then(response => {
        console.log('🌐 Fresh tee times response:', response.status);
        return response;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Only log API calls, not static assets
          if (event.request.url.includes('/api/')) {
            console.log('📦 Serving from cache:', event.request.url);
          }
          return cachedResponse;
        }

        // Otherwise fetch from network
        // Only log API calls, not static assets
        if (event.request.url.includes('/api/')) {
          console.log('🌐 Fetching from network:', event.request.url);
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Check if response has cache-busting headers
            const cacheControl = response.headers.get('Cache-Control');
            const pragma = response.headers.get('Pragma');
            
            // Don't cache if cache-busting headers are present
            if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
              console.log('🚫 Not caching due to cache-busting headers:', event.request.url);
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('❌ Network fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for tee time applications
self.addEventListener('sync', (event) => {
  if (event.tag === 'tee-time-application') {
    console.log('🔄 Background sync: Processing tee time applications');
    event.waitUntil(
      // Handle offline tee time applications
      processOfflineApplications()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update from Ultimate Golf Community',
    icon: '/logos/NEWLOGOREAL.png',
    badge: '/logos/NEWLOGOREAL.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/logos/NEWLOGOREAL.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logos/NEWLOGOREAL.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Ultimate Golf Community', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to process offline applications
async function processOfflineApplications() {
  try {
    // Get offline applications from IndexedDB
    const offlineApplications = await getOfflineApplications();
    
    for (const application of offlineApplications) {
      try {
        // Send application to server
        const response = await fetch('/api/tee-times', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'apply',
            ...application
          })
        });

        if (response.ok) {
          // Remove from offline storage
          await removeOfflineApplication(application.id);
          console.log('✅ Offline application synced:', application.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync application:', error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Helper functions for offline storage (simplified)
async function getOfflineApplications() {
  // In a real implementation, you'd use IndexedDB
  return [];
}

async function removeOfflineApplication(id) {
  // In a real implementation, you'd remove from IndexedDB
  console.log('🗑️ Removing offline application:', id);
}
