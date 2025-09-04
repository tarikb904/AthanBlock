const CACHE_NAME = 'imaanify-v1';
const STATIC_CACHE = 'imaanify-static-v1';

// Core files to cache for offline functionality
const CORE_FILES = [
  '/',
  '/dashboard',
  '/planner', 
  '/adhkar',
  '/settings',
  '/src/main.tsx',
  '/src/index.css',
  // Add other core assets as needed
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/adhkar/,
  /^\/api\/time-blocks/,
  /^\/api\/prayers/,
  /^\/api\/user\/profile/,
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core files');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('[SW] Core files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache core files:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/')
        .then((response) => {
          return response || fetch(request);
        })
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }
  
  // Handle static assets with cache-first strategy
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Only cache successful GET requests
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a custom offline response for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This data is not available offline' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'prayer-completion':
      event.waitUntil(syncPrayerCompletions());
      break;
    case 'adhkar-progress':
      event.waitUntil(syncAdhkarProgress());
      break;
    case 'time-block-updates':
      event.waitUntil(syncTimeBlockUpdates());
      break;
  }
});

async function syncPrayerCompletions() {
  try {
    // Get stored offline actions
    const offlineActions = await getOfflineActions('prayer-completion');
    
    for (const action of offlineActions) {
      await fetch(`/api/prayers/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data),
      });
    }
    
    // Clear synced actions
    await clearOfflineActions('prayer-completion');
    console.log('[SW] Prayer completions synced');
  } catch (error) {
    console.error('[SW] Failed to sync prayer completions:', error);
  }
}

async function syncAdhkarProgress() {
  try {
    const offlineActions = await getOfflineActions('adhkar-progress');
    
    for (const action of offlineActions) {
      await fetch(`/api/user-adhkar/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data),
      });
    }
    
    await clearOfflineActions('adhkar-progress');
    console.log('[SW] Adhkar progress synced');
  } catch (error) {
    console.error('[SW] Failed to sync adhkar progress:', error);
  }
}

async function syncTimeBlockUpdates() {
  try {
    const offlineActions = await getOfflineActions('time-block-updates');
    
    for (const action of offlineActions) {
      await fetch(`/api/time-blocks/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data),
      });
    }
    
    await clearOfflineActions('time-block-updates');
    console.log('[SW] Time block updates synced');
  } catch (error) {
    console.error('[SW] Failed to sync time block updates:', error);
  }
}

async function getOfflineActions(type) {
  // In a real implementation, you'd store these in IndexedDB
  return [];
}

async function clearOfflineActions(type) {
  // Clear the stored actions after successful sync
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle different notification types
  const tag = event.notification.tag;
  let urlToOpen = '/dashboard';
  
  switch (tag) {
    case 'prayer-reminder':
      urlToOpen = '/dashboard';
      break;
    case 'adhkar-reminder':
      urlToOpen = '/adhkar';
      break;
    case 'schedule-reminder':
      urlToOpen = '/planner';
      break;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification action clicks
self.addEventListener('notificationaction', (event) => {
  console.log('[SW] Notification action clicked:', event.action);
  
  event.notification.close();
  
  switch (event.action) {
    case 'mark-prayer-complete':
      event.waitUntil(handlePrayerCompletion(event.notification.data));
      break;
    case 'snooze':
      event.waitUntil(handleSnooze(event.notification.data));
      break;
    case 'open-app':
      event.waitUntil(clients.openWindow('/dashboard'));
      break;
  }
});

async function handlePrayerCompletion(data) {
  try {
    await fetch(`/api/prayers/${data.prayerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
  } catch (error) {
    console.error('[SW] Failed to mark prayer complete:', error);
    // Store for later sync
    await storeOfflineAction('prayer-completion', {
      id: data.prayerId,
      data: { completed: true }
    });
  }
}

async function handleSnooze(data) {
  // Schedule notification again in 5 minutes
  setTimeout(() => {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      tag: data.tag,
    });
  }, 5 * 60 * 1000);
}

async function storeOfflineAction(type, action) {
  // In a real implementation, store in IndexedDB for later sync
  console.log('[SW] Storing offline action:', type, action);
}
