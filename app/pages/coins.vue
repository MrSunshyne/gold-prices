<script setup lang="ts">
const {
  coins,
  currentCoins,
  coinsLoaded,
  fetchCoins,
  formatDate,
  formatPrice,
  timeAgo,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Dodo Gold Coins',
})

onMounted(() => {
  fetchCoins()
})

const selectedDenom = ref<number | null>(null)

const denominations = computed(() => currentCoins.value?.denominations ?? [])

// Chart: price history for selected denomination (or 1000 by default)
const activeDenom = computed(() => selectedDenom.value ?? 1000)

const coinChartData = computed(() => {
  const data = [...coins.value].reverse()
  const prices = data.map(entry => {
    const d = entry.denominations.find(dd => dd.denomination === activeDenom.value)
    return { date: entry.date, price: d?.price ?? 0 }
  }).filter(d => d.price > 0)

  if (prices.length === 0) return { data: [], minVal: 0, maxVal: 0 }

  const allVals = prices.map(p => p.price)
  const minVal = Math.floor(Math.min(...allVals) / 10000) * 10000
  const maxVal = Math.ceil(Math.max(...allVals) / 10000) * 10000
  return { data: prices, minVal, maxVal }
})

const chartWidth = 1000
const chartHeight = 360
const padLeft = 90
const padRight = 24
const padTop = 40
const padBottom = 40

function xScale(i: number, total: number): number {
  return padLeft + (i / Math.max(total - 1, 1)) * (chartWidth - padLeft - padRight)
}

function yScale(val: number, min: number, max: number): number {
  if (max === min) return (padTop + chartHeight - padBottom) / 2
  return padTop + (1 - (val - min) / (max - min)) * (chartHeight - padTop - padBottom)
}

const coinPath = computed(() => {
  const { data, minVal, maxVal } = coinChartData.value
  if (data.length < 2) return ''
  return data.map((d, i) => {
    const x = xScale(i, data.length)
    const y = yScale(d.price, minVal, maxVal)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

const hoverIndex = ref<number | null>(null)

function onChartHover(event: MouseEvent) {
  const svg = event.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const { data } = coinChartData.value
  const scaleX = chartWidth / rect.width

  let closest = 0
  let closestDist = Infinity
  for (let i = 0; i < data.length; i++) {
    const x = xScale(i, data.length)
    const dist = Math.abs(x - mouseX * scaleX)
    if (dist < closestDist) {
      closestDist = dist
      closest = i
    }
  }
  hoverIndex.value = closest
}

function onChartLeave() {
  hoverIndex.value = null
}

const yTicks = computed(() => {
  const { minVal, maxVal } = coinChartData.value
  const range = maxVal - minVal
  if (range === 0) return [minVal]
  const step = range <= 50000 ? 10000 : range <= 200000 ? 50000 : 100000
  const ticks = []
  for (let v = minVal; v <= maxVal; v += step) {
    ticks.push(v)
  }
  return ticks
})
</script>

<template>
  <main class="page">
    <div v-if="!coinsLoaded" class="loading">Loading coin data...</div>
    <template v-else-if="currentCoins">
    <div class="hero-section">
      <div class="meta-info">
        <span>Updated {{ formatDate(currentCoins.date) }}</span>
        <span class="divider"></span>
        <span>Bank of Mauritius</span>
      </div>
      <h2 class="main-title">Dodo Gold Coins</h2>
    </div>

    <section class="coins-grid-section">
      <h3 class="section-heading">Select Denomination</h3>
      <div class="coins-grid">
        <button
          v-for="d in denominations"
          :key="d.denomination"
          class="coin-switcher"
          :class="{ active: activeDenom === d.denomination }"
          @click="selectedDenom = d.denomination"
        >
          <div class="coin-icon">
            <div class="coin-inner">Rs {{ d.denomination }}</div>
          </div>
          <div class="coin-details">
            <div class="coin-price">{{ formatPrice(d.price) }}</div>
            <div class="coin-specs">
              <span>{{ d.weight_gm }}g</span>
              <span class="dot">&bull;</span>
              <span>{{ d.diameter_mm }}mm</span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="chart-section">
      <h3 class="section-heading">Price History — Rs {{ activeDenom }} Coin</h3>
      
      <div class="chart-wrapper">
        <svg
          v-if="coinChartData.data.length >= 2"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="chart"
          @mousemove="onChartHover"
          @mouseleave="onChartLeave"
        >
          <!-- Horizontal Grid Lines -->
          <line
            v-for="tick in yTicks"
            :key="tick"
            :x1="padLeft"
            :y1="yScale(tick, coinChartData.minVal, coinChartData.maxVal)"
            :x2="chartWidth - padRight"
            :y2="yScale(tick, coinChartData.minVal, coinChartData.maxVal)"
            stroke="var(--border)"
            stroke-width="1"
            stroke-dasharray="2 6"
          />

          <!-- Y-axis labels -->
          <text
            v-for="tick in yTicks"
            :key="'label-' + tick"
            :x="padLeft - 16"
            :y="yScale(tick, coinChartData.minVal, coinChartData.maxVal) + 4"
            text-anchor="end"
            class="chart-label"
          >
            {{ tick.toLocaleString() }}
          </text>

          <!-- Line -->
          <path
            :d="coinPath"
            fill="none"
            stroke="var(--gold-color)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- Hover Indicator -->
          <g v-if="hoverIndex !== null && coinChartData.data[hoverIndex]" class="hover-group">
            <line
              :x1="xScale(hoverIndex, coinChartData.data.length)"
              :y1="padTop"
              :x2="xScale(hoverIndex, coinChartData.data.length)"
              :y2="chartHeight - padBottom"
              stroke="var(--gold-accent)"
              stroke-width="1"
              stroke-dasharray="4 4"
            />
            <circle
              :cx="xScale(hoverIndex, coinChartData.data.length)"
              :cy="yScale(coinChartData.data[hoverIndex].price, coinChartData.minVal, coinChartData.maxVal)"
              r="5"
              fill="var(--bg)"
              stroke="var(--gold-color)"
              stroke-width="2"
            />
            
            <g class="tooltip" :transform="`translate(${Math.min(Math.max(xScale(hoverIndex, coinChartData.data.length), padLeft + 60), chartWidth - padRight - 60)}, ${Math.max(yScale(coinChartData.data[hoverIndex].price, coinChartData.minVal, coinChartData.maxVal) - 40, padTop)})`">
              <text x="0" y="-12" text-anchor="middle" class="tooltip-date">{{ formatDate(coinChartData.data[hoverIndex].date) }}</text>
              <text x="0" y="6" text-anchor="middle" class="tooltip-price">Rs {{ coinChartData.data[hoverIndex].price.toLocaleString() }}</text>
            </g>
          </g>

          <!-- X-axis labels -->
          <text
            v-for="(d, i) in coinChartData.data.filter((_, idx) => idx % Math.floor(Math.max(coinChartData.data.length / 6, 1)) === 0)"
            :key="'x-' + d.date"
            :x="xScale(coinChartData.data.indexOf(d), coinChartData.data.length)"
            :y="chartHeight - 12"
            text-anchor="middle"
            class="chart-label"
          >
            {{ new Date(d.date).getFullYear() }}
          </text>
        </svg>
        <div v-else class="chart-empty">
          <p>Insufficient data to generate historical chart</p>
        </div>
      </div>
    </section>

    <section class="table-section">
      <h3 class="section-heading">Recent Prices</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th v-for="d in denominations" :key="d.denomination">Rs {{ d.denomination }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in coins.slice(0, 30)" :key="entry.date">
              <td class="td-date">{{ formatDate(entry.date) }}</td>
              <td v-for="d in entry.denominations" :key="d.denomination" class="td-price">
                {{ formatPrice(d.price) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </template>
  </main>
</template>

<style scoped>
.loading {
  padding: 120px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 24px;
  width: 100%;
}

.hero-section {
  margin-bottom: 64px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
}

.divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--border);
}

.main-title {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 48px;
  letter-spacing: -0.02em;
}

.section-heading {
  font-family: var(--font);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
}

.coins-grid-section {
  margin-bottom: 80px;
}

.coins-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.coin-switcher {
  background: transparent;
  border: none;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
  outline: none;
  opacity: 0.6;
}

.coin-switcher:hover {
  opacity: 0.8;
  transform: translateY(-4px);
}

.coin-switcher.active {
  opacity: 1;
  transform: translateY(-4px) scale(1.05);
}

.coin-icon {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-light), var(--gold-accent));
  padding: 4px;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease;
}

.coin-switcher.active .coin-icon {
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 12px 24px -4px rgba(212, 175, 55, 0.4), 0 0 0 2px var(--gold-color);
}

.coin-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-accent), var(--gold-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

html.dark .coin-inner {
  color: #000;
  text-shadow: 0 1px 2px rgba(255,255,255,0.3);
}

.coin-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coin-price {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.coin-specs {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dot {
  color: var(--border);
}

.chart-section {
  margin-bottom: 80px;
}

.chart-wrapper {
  margin-top: 32px;
}

.chart {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.chart-label {
  font-size: 12px;
  fill: var(--text-muted);
}

.tooltip-date {
  font-size: 12px;
  fill: var(--text-muted);
}

.tooltip-price {
  font-size: 16px;
  font-weight: 600;
  fill: var(--text);
}

.chart-empty {
  padding: 80px 0;
  text-align: center;
  color: var(--text-muted);
}

.table-section {
  margin-bottom: 40px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

thead {
  border-bottom: 2px solid var(--border);
}

th {
  padding: 16px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

td {
  padding: 20px 0;
  font-size: 16px;
  font-family: var(--font-display);
  border-bottom: 1px solid var(--row-border);
  color: var(--text);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: background 0.2s;
}

tbody tr:hover {
  background: var(--row-hover);
}

.td-date {
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 14px;
  white-space: nowrap;
}

.td-price {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .page {
    padding: 40px 16px;
  }

  .main-title {
    font-size: 40px;
  }
  
  .coins-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .coin-switcher {
    padding: 12px 8px;
  }

  .coin-icon {
    width: 70px;
    height: 70px;
  }

  .coin-inner {
    font-size: 14px;
  }

  .coin-price {
    font-size: 20px;
  }

  .coin-specs {
    flex-direction: column;
    gap: 2px;
  }
  
  .dot {
    display: none;
  }
}

@media (max-width: 480px) {
  .coins-grid {
    grid-template-columns: 1fr;
  }

  .coin-specs {
    flex-direction: row;
    gap: 8px;
  }
  
  .dot {
    display: inline;
  }
}
</style>
