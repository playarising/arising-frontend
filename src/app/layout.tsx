import { ThemeProvider, WalletProvider } from '@/providers'
import type { Metadata } from 'next'
import { Cinzel, Montserrat } from 'next/font/google'

const MONTSERRAT = Montserrat({ variable: '--font-montserrat', subsets: ['latin', 'latin-ext'] })
const CINZEL = Cinzel({ variable: '--font-cinzel', subsets: ['latin'], weight: ['400'] })

const DESCRIPTION =
  'Arising is the first web3 roleplay community, where users engage in dynamic campaigns that shape their fate and determine the destiny of the world of Etia.'

const URL = 'https://playarising.com'

const TITLE = 'Arising: A Twirl of Destinies'

// biome-ignore lint/style/useNamingConvention: required to be lowercase for NextJS specific functionality
export const metadata: Metadata = {
  themeColor: '#022127',
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    images: [
      {
        url: '',
        width: 800,
        height: 1400,
        alt: 'og image arising'
      }
    ],
    siteName: TITLE,
    locale: 'en_US',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${MONTSERRAT.className} ${CINZEL.className}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <WalletProvider>
            <main style={{ position: 'relative', overflowX: 'hidden' }}>{children}</main>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
