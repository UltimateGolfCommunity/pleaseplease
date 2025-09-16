'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('✅ Service Worker registered successfully:', registration.scope)
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  console.log('🔄 New content available! Please refresh.')
                  // You could show a toast notification here
                }
              })
            }
          })
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error)
        }
      })
    }

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('✅ Notification permission granted')
          } else {
            console.log('❌ Notification permission denied')
          }
        })
      }
    }
  }, [])

  return null // This component doesn't render anything
}
