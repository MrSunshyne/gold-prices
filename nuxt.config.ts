export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  watch: {
    exclude: ['.output', 'node_modules'],
  },

  app: {
    baseURL: '/',
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Daily gold prices in Mauritius since 2004. Track 24K, 22K, 21K, and 18K industrial gold and Dodo Gold Coins from the Bank of Mauritius.' },
        { name: 'keywords', content: 'mauritius, gold, prices, bank of mauritius, industrial gold, dodo coin, 24k, 22k, 21k, 18k, price history, gold chart' },
        { name: 'author', content: 'Sandeep Ramgolam' },
        { property: 'og:title', content: 'Mauritius Gold Price Index' },
        { property: 'og:description', content: 'Daily gold prices in Mauritius since 2004. Interactive charts, karat comparison, and Dodo Gold Coin pricing from the Bank of Mauritius.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://gold.ramgolam.com/og-image.png' },
        { property: 'og:image:width', content: '1400' },
        { property: 'og:image:height', content: '788' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Mauritius Gold Price Index' },
        { name: 'twitter:description', content: 'Daily gold prices in Mauritius since 2004. Interactive charts and Dodo Gold Coin pricing.' },
        { name: 'twitter:image', content: 'https://gold.ramgolam.com/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap' },
      ],
    },
  },
})
