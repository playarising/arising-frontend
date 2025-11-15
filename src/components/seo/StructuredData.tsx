import Script from 'next/script'

type StructuredDataProps = {
  canonicalUrl: string
}

export function StructuredData({ canonicalUrl }: StructuredDataProps) {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Arising',
      url: canonicalUrl,
      description: 'Arising is the first web3 roleplay community where every campaign changes the fate of Etia.',
      inLanguage: 'en-US',
      sameAs: ['https://x.com/playarising', 'https://playarising.com']
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: 'Arising',
      gamePlatform: ['Web3', 'Browser'],
      applicationCategory: 'Game',
      url: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'Grupo Kindynos',
        url: 'https://kindynos.mx'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        ratingCount: '12'
      }
    }
  ]

  return (
    <Script id="structured-data" strategy="beforeInteractive" type="application/ld+json">
      {JSON.stringify(structuredData)}
    </Script>
  )
}
