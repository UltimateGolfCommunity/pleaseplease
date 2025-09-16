import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PWARegistration from '@/app/components/PWARegistration'

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
        url: '/thereallogo.png',
        width: 1200,
        height: 630,
        alt: 'Ultimate Golf Community Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultimate Golf Community - Connect, Play, Improve',
    description: 'Connect with golfers, book tee times, track your game, and join the ultimate golf community.',
    images: ['/thereallogo.png'],
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
        <link rel="icon" href="/thereallogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/thereallogo.png" />
        <link rel="shortcut icon" href="/thereallogo.png" />
        <meta name="theme-color" content="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-TileImage" content="/thereallogo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image:alt" content="Ultimate Golf Community Logo" />
        
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UGC Golf" />
        <meta name="application-name" content="Ultimate Golf Community" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* iOS PWA Support */}
        <link rel="apple-touch-icon" sizes="180x180" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/thereallogo.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/thereallogo.png" />
        
        {/* Android PWA Support */}
        <link rel="icon" type="image/png" sizes="192x192" href="/thereallogo.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/thereallogo.png" />
        <link rel="icon" type="image/png" sizes="144x144" href="/thereallogo.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/thereallogo.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/thereallogo.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/thereallogo.png" />
      </head>
      <body className={`${inter.className} bg-theme-gradient text-theme-primary transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PWARegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
