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

export interface TimeseriesData {
  dates: string[]
  price_per_gram: number[]
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

// Shared state across pages
const currentData = ref<GoldPriceEntry | null>(null)
const timeseries = ref<TimeseriesData | null>(null)
const indexData = ref<IndexData | null>(null)
const prices = ref<GoldPriceEntry[]>([])
const coins = ref<GoldCoinEntry[]>([])
const coreLoading = ref(true)
const pricesLoaded = ref(false)
const coinsLoaded = ref(false)

const sortField = ref<SortField>('date')
const sortDirection = ref<SortDirection>('desc')

export function useGoldPrices() {
  // Fetch lightweight files on app startup (~285 KB total)
  async function fetchCoreData() {
    try {
      const [currentRes, tsRes, indexRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/current.json`),
        fetch(`${BASE_URL}/timeseries.json`),
        fetch(`${BASE_URL}/index.json`),
      ])

      if (currentRes.status === 'fulfilled' && currentRes.value.ok) {
        const data = await currentRes.value.json()
        if (data?.date && data?.price_per_gram != null) {
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

  // Lazy fetch full prices for history table
  async function fetchPrices() {
    if (pricesLoaded.value || prices.value.length > 0) return
    try {
      const res = await fetch(`${BASE_URL}/prices.json`)
      if (!res.ok) return
      const data: GoldPriceEntry[] = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        prices.value = data
        pricesLoaded.value = true
      }
    }
    catch {
      // Silent failure
    }
  }

  // Lazy fetch coins data
  async function fetchCoins() {
    if (coinsLoaded.value || coins.value.length > 0) return
    try {
      const res = await fetch(`${BASE_URL}/coins.json`)
      if (!res.ok) return
      const data: GoldCoinEntry[] = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        coins.value = data
        coinsLoaded.value = true
      }
    }
    catch {
      // Silent failure
    }
  }

  const currentPrice = computed(() => currentData.value)
  const currentCoins = computed(() => coins.value[0] ?? null)

  // Compute last change from timeseries (newest is at end)
  const lastChange = computed(() => {
    if (!timeseries.value) return null
    const { dates, price_per_gram } = timeseries.value
    const len = dates.length
    if (len < 2) return null
    const current = price_per_gram[len - 1]
    for (let i = len - 2; i >= 0; i--) {
      if (price_per_gram[i] !== current) {
        const change = +(current - price_per_gram[i]).toFixed(2)
        const changePercent = +(((current - price_per_gram[i]) / price_per_gram[i]) * 100).toFixed(2)
        return { change, changePercent, sinceDate: dates[i] }
      }
    }
    return { change: 0, changePercent: 0, sinceDate: dates[0] }
  })

  // All-time high/low from timeseries
  const allTimeHigh = computed(() => {
    if (!timeseries.value) return null
    const { dates, price_per_gram } = timeseries.value
    let maxIdx = 0
    for (let i = 1; i < price_per_gram.length; i++) {
      if (price_per_gram[i] > price_per_gram[maxIdx]) maxIdx = i
    }
    return { date: dates[maxIdx], price_per_gram: price_per_gram[maxIdx] }
  })

  const allTimeLow = computed(() => {
    if (!timeseries.value) return null
    const { dates, price_per_gram } = timeseries.value
    let minIdx = 0
    for (let i = 1; i < price_per_gram.length; i++) {
      if (price_per_gram[i] < price_per_gram[minIdx]) minIdx = i
    }
    return { date: dates[minIdx], price_per_gram: price_per_gram[minIdx] }
  })

  // Chart data from timeseries (already chronological, oldest first)
  const chartData = computed(() => {
    if (!timeseries.value) return { data: [], minVal: 0, maxVal: 0 }
    const { dates, price_per_gram } = timeseries.value
    const data = dates.map((date, i) => ({ date, price_per_gram: price_per_gram[i] }))
    const minVal = Math.floor(Math.min(...price_per_gram) / 500) * 500
    const maxVal = Math.ceil(Math.max(...price_per_gram) / 500) * 500
    return { data, minVal, maxVal }
  })

  // Index stats
  const totalEntries = computed(() => indexData.value?.total_entries ?? 0)
  const firstDate = computed(() => indexData.value?.first_date ?? '')
  const lastDate = computed(() => indexData.value?.last_date ?? '')

  // Sorted prices for history table
  const sortedPrices = computed(() => {
    if (prices.value.length === 0) return []
    const result = [...prices.value]
    result.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sortField.value) {
        case 'date':
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
          break
        case '24k':
          aVal = a.karats['24k']
          bVal = b.karats['24k']
          break
        case '22k':
          aVal = a.karats['22k']
          bVal = b.karats['22k']
          break
        case '21k':
          aVal = a.karats['21k']
          bVal = b.karats['21k']
          break
        case '18k':
          aVal = a.karats['18k']
          bVal = b.karats['18k']
          break
        default:
          aVal = 0
          bVal = 0
      }
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    })
    return result
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
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
    prices,
    coins,
    currentPrice,
    currentCoins,
    lastChange,
    allTimeHigh,
    allTimeLow,
    chartData,
    sortedPrices,
    sortField,
    sortDirection,
    coreLoading,
    pricesLoaded,
    coinsLoaded,
    totalEntries,
    firstDate,
    lastDate,
    indexData,
    DATA_SOURCE,
    // Actions
    fetchCoreData,
    fetchPrices,
    fetchCoins,
    toggleSort,
    // Formatters
    formatDate,
    formatPrice,
    formatPriceShort,
    timeAgo,
  }
}
