import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ultimate Golf Community - Connect, Play, Improve',
  description: 'Connect with golfers, book tee times, track your game, and join the ultimate golf community. Find playing partners, discover courses, and improve your golf game together.',
  keywords: ['golf', 'golf community', 'tee times', 'golf courses', 'golf partners', 'golf app', 'golf social'],
  authors: [{ name: 'Ultimate Golf Community' }],
  creator: 'Ultimate Golf Community',
  publisher: 'Ultimate Golf Community',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.ultimategolfcommunity.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ultimate Golf Community - Connect, Play, Improve',
    description: 'Connect with golfers, book tee times, track your game, and join the ultimate golf community. Find playing partners, discover courses, and improve your golf game together.',
    url: 'https://www.ultimategolfcommunity.com',
    siteName: 'Ultimate Golf Community',
    images: [
      {
        url: '/NEWLOGOREAL.png',
        width: 1200,
        height: 630,
        alt: 'Ultimate Golf Community Logo',
      },
      {
        url: '/logoreal.png',
        width: 800,
        height: 600,
        alt: 'Ultimate Golf Community',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultimate Golf Community - Connect, Play, Improve',
    description: 'Connect with golfers, book tee times, track your game, and join the ultimate golf community.',
    images: ['/NEWLOGOREAL.png'],
    creator: '@UltimateGolfCommunity',
    site: '@UltimateGolfCommunity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/NEWLOGOREAL.png" type="image/png" />
        <link rel="apple-touch-icon" href="/NEWLOGOREAL.png" />
        <link rel="shortcut icon" href="/NEWLOGOREAL.png" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-TileImage" content="/NEWLOGOREAL.png" />
      </head>
      <body className={`${inter.className} bg-theme-gradient text-theme-primary transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
