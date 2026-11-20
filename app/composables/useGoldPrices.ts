const BASE_URL = 'https://raw.githubusercontent.com/MrSunshyne/mauritius-dataset-gold/main/data'

export interface GoldPriceEntry {
  date: string
  price_per_gram: number
  karats: {
    '24k': number
    '22k': number
    '21k': number
    '18k': number
  }
  forms?: {
    form: string
    weight_oz: number
    weight_gm: number
    price_per_gm: number
  }[]
}

export interface CoinDenomination {
  denomination: number
  weight_gm: number
  diameter_mm: number
  price: number
}

export interface GoldCoinEntry {
  date: string
  denominations: CoinDenomination[]
}

export interface CoinsTimeseriesData {
  dates: string[]
  // Prices per denomination, parallel to dates; null when BOM didn't list it
  prices: Record<string, (number | null)[]>
}

export interface TimeseriesData {
  dates: string[]
  price_per_gram: number[]
  bar_price_per_gram?: (number | null)[]
  karats: Record<'24k' | '22k' | '21k' | '18k', number[]>
}

export interface YearSummary {
  entries: number
  first_date: string
  last_date: string
  open: number
  close: number
  min: number
  max: number
  avg: number
  change_pct: number
}

export interface InternationalTimeseriesData {
  dates: string[]
  comex_usd_per_oz: number[]
  usd_mur: number[]
  world_price_per_gram: number[]
  premium_pct: number[]
}

export interface IndexData {
  total_entries: number
  first_date: string
  last_date: string
  generated: string
  years: Record<string, YearSummary>
}

export const DATA_SOURCE = {
  name: 'Bank of Mauritius',
  url: 'https://www.bom.mu/industrial-gold',
}

export type SortField = 'date' | '24k' | '22k' | '21k' | '18k'
export type SortDirection = 'asc' | 'desc'
export type PriceForm = 'Grains' | 'Bar'

// Shared state across pages. The current price lives in useState so the value
// fetched while prerendering is shipped with the page.
const timeseries = ref<TimeseriesData | null>(null)
const indexData = ref<IndexData | null>(null)
const currentCoins = ref<GoldCoinEntry | null>(null)
const coinsTimeseries = ref<CoinsTimeseriesData | null>(null)
const coreLoading = ref(true)
const coinsLoaded = ref(false)
const international = ref<InternationalTimeseriesData | null>(null)

const sortField = ref<SortField>('date')
const sortDirection = ref<SortDirection>('desc')

// Grains/Bar toggle; drives the headline price, chart, trend and all-time high
const selectedForm = ref<PriceForm>('Grains')

export function useGoldPrices() {
  const currentData = useState<GoldPriceEntry | null>('current-price', () => null)

  function isPriceEntry(data: GoldPriceEntry | null | undefined): data is GoldPriceEntry {
    return !!data?.date && data.price_per_gram != null
  }

  // Today's price only; run while prerendering so it's in the HTML
  async function fetchCurrentPrice() {
    try {
      const data = await $fetch<GoldPriceEntry>(`${BASE_URL}/current.json`, { responseType: 'json' })
      if (isPriceEntry(data)) currentData.value = data
    }
    catch {
      // Silent failure
    }
  }

  // Fetch lightweight files on app startup (~330 KB total)
  async function fetchCoreData() {
    try {
      const [currentRes, tsRes, indexRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/current.json`),
        fetch(`${BASE_URL}/timeseries.json`),
        fetch(`${BASE_URL}/index.json`),
      ])

      if (currentRes.status === 'fulfilled' && currentRes.value.ok) {
        const data = await currentRes.value.json()
        if (isPriceEntry(data)) {
          currentData.value = data
        }
      }

      if (tsRes.status === 'fulfilled' && tsRes.value.ok) {
        const data = await tsRes.value.json()
        if (data?.dates?.length && data?.price_per_gram?.length) {
          timeseries.value = data
        }
      }

      if (indexRes.status === 'fulfilled' && indexRes.value.ok) {
        const data = await indexRes.value.json()
        if (data?.total_entries) {
          indexData.value = data
        }
      }
    }
    catch {
      // Silent failure
    }
    finally {
      coreLoading.value = false
    }
  }

  // Lazy fetch the world price comparison (~220 KB)
  async function fetchInternational() {
    if (international.value) return
    try {
      const res = await fetch(`${BASE_URL}/international-timeseries.json`)
      if (!res.ok) return
      const data: InternationalTimeseriesData = await res.json()
      if (data?.dates?.length) international.value = data
    }
    catch {
      // Silent failure
    }
  }

  // Lazy fetch coin data for the coins page (~200 KB)
  async function fetchCoins() {
    if (coinsLoaded.value) return
    try {
      const [currentRes, tsRes] = await Promise.all([
        fetch(`${BASE_URL}/coins-current.json`),
        fetch(`${BASE_URL}/coins-timeseries.json`),
      ])
      if (!currentRes.ok || !tsRes.ok) return
      const current: GoldCoinEntry = await currentRes.json()
      const ts: CoinsTimeseriesData = await tsRes.json()
      if (current?.denominations?.length && ts?.dates?.length) {
        currentCoins.value = current
        coinsTimeseries.value = ts
        coinsLoaded.value = true
      }
    }
    catch {
      // Silent failure
    }
  }

  const currentPrice = computed(() => currentData.value)

  // Grains price on a given date from the timeseries, once loaded
  function grainsPriceOn(date: string): number | null {
    if (!timeseries.value) return null
    const i = timeseries.value.dates.lastIndexOf(date)
    return i === -1 ? null : timeseries.value.price_per_gram[i]
  }

  // Daily prices for the selected form, oldest first
  const priceSeries = computed(() => {
    if (!timeseries.value) return null
    const { price_per_gram, bar_price_per_gram } = timeseries.value
    if (selectedForm.value === 'Grains' || !bar_price_per_gram) return price_per_gram
    return bar_price_per_gram.map((p, i) => p ?? price_per_gram[i])
  })

  // Show the current trend relative to where it started: the last peak or low
  // that the price has since moved away from by at least SWING_THRESHOLD.
  // Smaller wiggles don't count as a new move, so a one-day drop is reported
  // as part of the decline from the last real peak rather than "from yesterday".
  const SWING_THRESHOLD = 0.05
  const lastChange = computed(() => {
    if (!timeseries.value || !priceSeries.value) return null
    const { dates } = timeseries.value
    const prices = priceSeries.value
    const len = prices.length
    if (len < 2) return null

    let pivot = 0 // start of the current move (a peak or a low)
    let extreme = 0 // highest (rising) or lowest (falling) price since the pivot
    let rising = true
    for (let i = 1; i < len; i++) {
      const price = prices[i]
      if (rising ? price > prices[extreme] : price < prices[extreme]) {
        extreme = i
      }
      else if (rising ? price <= prices[extreme] / (1 + SWING_THRESHOLD) : price >= prices[extreme] * (1 + SWING_THRESHOLD)) {
        // Reversed far enough: the extreme becomes the start of a new move
        pivot = extreme
        extreme = i
        rising = !rising
      }
    }

    const refPrice = prices[pivot]
    const change = +(prices[len - 1] - refPrice).toFixed(2)
    const changePercent = +((change / refPrice) * 100).toFixed(2)
    return { change, changePercent, sinceDate: dates[pivot] }
  })

  // All-time high for the selected form
  const allTimeHigh = computed(() => {
    if (!timeseries.value || !priceSeries.value) return null
    const { dates } = timeseries.value
    const prices = priceSeries.value
    let maxIdx = 0
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[maxIdx]) maxIdx = i
    }
    return { date: dates[maxIdx], price_per_gram: prices[maxIdx] }
  })

  // Chart data for the selected form (already chronological, oldest first)
  const chartData = computed(() => {
    if (!timeseries.value || !priceSeries.value) return { data: [], minVal: 0, maxVal: 0 }
    const { dates } = timeseries.value
    const prices = priceSeries.value
    const data = dates.map((date, i) => ({ date, price_per_gram: prices[i] }))
    const minVal = Math.floor(Math.min(...prices) / 500) * 500
    const maxVal = Math.ceil(Math.max(...prices) / 500) * 500
    return { data, minVal, maxVal }
  })

  // Index stats
  const totalEntries = computed(() => indexData.value?.total_entries ?? 0)
  const firstDate = computed(() => indexData.value?.first_date ?? '')
  const lastDate = computed(() => indexData.value?.last_date ?? '')

  // History table rows from the timeseries, sorted by the selected column
  const sortedPrices = computed(() => {
    if (!timeseries.value) return []
    const { dates, karats } = timeseries.value
    const rows = dates.map((date, i) => ({
      date,
      karats: {
        '24k': karats['24k'][i],
        '22k': karats['22k'][i],
        '21k': karats['21k'][i],
        '18k': karats['18k'][i],
      },
    }))
    const key = sortField.value
    // ISO dates sort correctly as strings
    rows.sort((a, b) => {
      const diff = key === 'date' ? a.date.localeCompare(b.date) : a.karats[key] - b.karats[key]
      return sortDirection.value === 'asc' ? diff : -diff
    })
    return rows
  })

  function toggleSort(field: SortField) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    }
    else {
      sortField.value = field
      sortDirection.value = field === 'date' ? 'desc' : 'asc'
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    // Dates are calendar days; format in UTC so every timezone shows the same day
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  function formatPrice(value: number): string {
    return `Rs ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatPriceShort(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function timeAgo(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInMonths = Math.floor(diffInDays / 30.44)
    const diffInYears = Math.floor(diffInDays / 365.25)

    if (diffInYears > 0) return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`
    if (diffInMonths > 0) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`
    if (diffInDays > 0) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    return 'Today'
  }

  return {
    // State
    currentPrice,
    selectedForm,
    currentCoins,
    coinsTimeseries,
    lastChange,
    allTimeHigh,
    chartData,
    sortedPrices,
    sortField,
    sortDirection,
    coreLoading,
    coinsLoaded,
    international,
    grainsPriceOn,
    totalEntries,
    firstDate,
    lastDate,
    indexData,
    DATA_SOURCE,
    // Actions
    fetchCurrentPrice,
    fetchCoreData,
    fetchCoins,
    fetchInternational,
    toggleSort,
    // Formatters
    formatDate,
    formatPrice,
    formatPriceShort,
    timeAgo,
  }
}
