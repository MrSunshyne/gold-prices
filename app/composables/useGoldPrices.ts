import { prices as fallbackPrices, DATA_SOURCE, type GoldPriceEntry } from '~/data/prices'
import { coins as fallbackCoins, type GoldCoinEntry } from '~/data/coins'

const PRICES_URL = 'https://raw.githubusercontent.com/MrSunshyne/mauritius-dataset-gold/main/data/prices.json'
const COINS_URL = 'https://raw.githubusercontent.com/MrSunshyne/mauritius-dataset-gold/main/data/coins.json'

export type SortField = 'date' | '24k' | '22k' | '21k' | '18k'
export type SortDirection = 'asc' | 'desc'

const sortField = ref<SortField>('date')
const sortDirection = ref<SortDirection>('desc')
const livePrices = ref<GoldPriceEntry[] | null>(null)
const liveCoins = ref<GoldCoinEntry[] | null>(null)

export function useGoldPrices() {
  const prices = computed(() => livePrices.value ?? fallbackPrices)
  const coins = computed(() => liveCoins.value ?? fallbackCoins)

  async function fetchLiveData() {
    try {
      const [pricesRes, coinsRes] = await Promise.allSettled([
        fetch(PRICES_URL),
        fetch(COINS_URL),
      ])

      if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
        const data: GoldPriceEntry[] = await pricesRes.value.json()
        if (Array.isArray(data) && data.length > 0 && data[0].date && data[0].price_per_gram != null) {
          livePrices.value = data
        }
      }

      if (coinsRes.status === 'fulfilled' && coinsRes.value.ok) {
        const data: GoldCoinEntry[] = await coinsRes.value.json()
        if (Array.isArray(data) && data.length > 0 && data[0].date && data[0].denominations) {
          liveCoins.value = data
        }
      }
    }
    catch {
      // Silently fall back to bundled data
    }
  }

  const currentPrice = computed(() => prices.value[0])
  const currentCoins = computed(() => coins.value[0])

  const lastChange = computed(() => {
    const p = prices.value
    const curr = p[0]
    for (let i = 1; i < p.length; i++) {
      if (p[i].price_per_gram !== curr.price_per_gram) {
        return {
          change: +(curr.price_per_gram - p[i].price_per_gram).toFixed(2),
          changePercent: +(((curr.price_per_gram - p[i].price_per_gram) / p[i].price_per_gram) * 100).toFixed(2),
          sinceDate: p[i].date,
        }
      }
    }
    return { change: 0, changePercent: 0, sinceDate: curr.date }
  })

  const allTimeHigh = computed(() => {
    const max = Math.max(...prices.value.map(p => p.price_per_gram))
    return prices.value.find(p => p.price_per_gram === max)!
  })

  const allTimeLow = computed(() => {
    const min = Math.min(...prices.value.map(p => p.price_per_gram))
    return [...prices.value].reverse().find(p => p.price_per_gram === min)!
  })

  // Chronological order (oldest first) for chart
  const chronologicalPrices = computed(() => [...prices.value].reverse())

  const sortedPrices = computed(() => {
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

  const chartData = computed(() => {
    const data = chronologicalPrices.value
    const allValues = data.map(d => d.price_per_gram)
    const minVal = Math.floor(Math.min(...allValues) / 500) * 500
    const maxVal = Math.ceil(Math.max(...allValues) / 500) * 500
    return { data, minVal, maxVal }
  })

  return {
    prices,
    coins,
    currentPrice,
    currentCoins,
    lastChange,
    allTimeHigh,
    allTimeLow,
    chronologicalPrices,
    sortedPrices,
    sortField,
    sortDirection,
    chartData,
    DATA_SOURCE,
    fetchLiveData,
    toggleSort,
    formatDate,
    formatPrice,
    formatPriceShort,
    timeAgo,
  }
}
