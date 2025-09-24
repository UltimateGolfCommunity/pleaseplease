# Clear Browser Cache to Fix Tee Times Display

## Quick Fix: Clear Browser Cache

The tee times are being served from cache. Here's how to fix it:

### Method 1: Hard Refresh
1. **Chrome/Edge**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Firefox**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
3. **Safari**: Press `Cmd+Option+R`

### Method 2: Clear Cache in DevTools
1. Open Developer Tools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Disable Service Worker (Temporary)
1. Open Developer Tools (`F12`)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** next to your service worker
5. Refresh the page

### Method 4: Clear All Cache
1. Open Developer Tools (`F12`)
2. Go to **Application** tab
3. Click **Storage** in the left sidebar
4. Click **Clear site data**
5. Refresh the page

## Expected Result
After clearing the cache, you should see the tee times displayed on the home page.
