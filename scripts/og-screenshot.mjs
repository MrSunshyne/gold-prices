import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1400, height: 788 },
  colorScheme: 'dark',
})

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

// Wait for data to load
await page.waitForTimeout(3000)

// Hide header, footer, and non-essential text for a cleaner OG image
await page.evaluate(() => {
  // Hide header and footer
  const header = document.querySelector('.header')
  if (header) header.style.display = 'none'
  const footer = document.querySelector('.page-footer')
  if (footer) footer.style.display = 'none'
  const topAccent = document.querySelector('.top-accent')
  if (topAccent) topAccent.style.display = 'none'

  // Hide the meta badge ("Updated today")
  const meta = document.querySelector('.meta-badge')
  if (meta) meta.style.display = 'none'

  // Hide the trend indicator line
  const trend = document.querySelector('.trend-indicator')
  if (trend) trend.style.display = 'none'

  // Hide the price description
  const desc = document.querySelector('.price-desc')
  if (desc) desc.style.display = 'none'

  // Hide the form toggle (Grains/Bar)
  const formToggle = document.querySelector('.form-toggle')
  if (formToggle) formToggle.style.display = 'none'

  // Hide the purity grid labels
  const purityGrid = document.querySelector('.purity-grid')
  if (purityGrid) purityGrid.style.display = 'none'

  // Replace title text
  const title = document.querySelector('.massive-title')
  if (title) title.innerHTML = '<span class="text-light">Mauritius</span><br/>Gold Prices'

  // Adjust the page to center content vertically
  const luxPage = document.querySelector('.luxury-page')
  if (luxPage) {
    luxPage.style.minHeight = '100vh'
    luxPage.style.display = 'flex'
    luxPage.style.alignItems = 'center'
  }

  // Make the hero container tighter
  const heroContainer = document.querySelector('.hero-container')
  if (heroContainer) {
    heroContainer.style.padding = '0 48px'
  }
})

await page.waitForTimeout(500)

await page.screenshot({
  path: 'public/og-image.png',
  type: 'png',
})

console.log('Screenshot saved to public/og-image.png')
await browser.close()
