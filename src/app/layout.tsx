import type { Metadata, Viewport } from 'next'
import { Cinzel, Montserrat } from 'next/font/google'
import { SiteHeader, StructuredData } from '@/components'
import { ThemeProvider } from '@/providers'

const MONTSERRAT = Montserrat({ variable: '--font-montserrat', subsets: ['latin', 'latin-ext'] })
const CINZEL = Cinzel({ variable: '--font-cinzel', subsets: ['latin'], weight: ['400'] })

const DESCRIPTION =
  'Arising is the first web3 roleplay community, where users engage in dynamic campaigns that shape their fate and determine the destiny of the world of Etia.'

const SITE_URL = 'https://playarising.com'

const TITLE = 'Arising: A Twirl of Destinies'
const TITLE_TEMPLATE = '%s | Arising'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: TITLE_TEMPLATE
  },
  description: DESCRIPTION,
  applicationName: 'Arising',
  keywords: [
    'Arising',
    'web3 roleplay',
    'blockchain RPG',
    'Etia',
    'fantasy roleplaying',
    'crypto gaming',
    'immersive lore'
  ],
  category: 'role-playing game',
  manifest: '/manifest.json',
  authors: [{ name: 'Grupo Kindynos', url: 'https://kindynos.mx' }],
  creator: 'Grupo Kindynos',
  publisher: 'Grupo Kindynos',
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/'
    }
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.webp', type: 'image/webp' }
    ],
    apple: '/apple-icon.webp',
    other: [{ rel: 'mask-icon', url: '/icon.svg' }]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/assets/opengraph.webp',
        width: 1400,
        height: 788,
        alt: 'og image arising'
      }
    ],
    siteName: TITLE,
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@playarising',
    creator: '@playarising',
    images: ['/assets/opengraph.jpeg']
  },
  appLinks: {
    web: {
      url: SITE_URL,
      should_fallback: true
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#022127',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${MONTSERRAT.variable} ${CINZEL.variable}`} suppressHydrationWarning>
      <head>
        <StructuredData canonicalUrl={SITE_URL} />
      </head>
      <body>
        <ThemeProvider>
          <main style={{ position: 'relative', overflowX: 'hidden' }}>
            <SiteHeader />
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
