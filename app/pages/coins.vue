<script setup lang="ts">
const {
  coins,
  currentCoins,
  formatDate,
  formatPrice,
  timeAgo,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Dodo Gold Coins',
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

const chartWidth = 900
const chartHeight = 300
const padLeft = 90
const padRight = 24
const padTop = 24
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
    <section class="hero">
      <h2>Dodo Gold Coins</h2>
      <p class="hero-sub">Official gold coins issued by the Bank of Mauritius, available in four denominations.</p>
    </section>

    <!-- Current Coin Prices -->
    <section class="coins-grid">
      <div
        v-for="d in denominations"
        :key="d.denomination"
        class="coin-card"
        :class="{ active: activeDenom === d.denomination }"
        @click="selectedDenom = d.denomination"
      >
        <div class="coin-denom">Rs {{ d.denomination }}</div>
        <div class="coin-price">{{ formatPrice(d.price) }}</div>
        <div class="coin-specs">
          <span>{{ d.weight_gm }}g</span>
          <span>{{ d.diameter_mm }}mm</span>
        </div>
      </div>
    </section>

    <div class="coin-date">Prices as of {{ formatDate(currentCoins.date) }} ({{ timeAgo(currentCoins.date) }})</div>

    <!-- Coin Price Chart -->
    <section class="chart-section">
      <h3>Rs {{ activeDenom }} Coin — Price History</h3>
      <div class="chart-container">
        <svg
          v-if="coinChartData.data.length >= 2"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="chart"
          @mousemove="onChartHover"
          @mouseleave="onChartLeave"
        >
          <line
            v-for="tick in yTicks"
            :key="tick"
            :x1="padLeft"
            :y1="yScale(tick, coinChartData.minVal, coinChartData.maxVal)"
            :x2="chartWidth - padRight"
            :y2="yScale(tick, coinChartData.minVal, coinChartData.maxVal)"
            stroke="var(--row-border)"
            stroke-width="1"
          />

          <text
            v-for="tick in yTicks"
            :key="'label-' + tick"
            :x="padLeft - 8"
            :y="yScale(tick, coinChartData.minVal, coinChartData.maxVal) + 4"
            text-anchor="end"
            class="chart-label"
          >
            {{ tick.toLocaleString() }}
          </text>

          <path
            :d="coinPath"
            fill="none"
            stroke="var(--gold-color)"
            stroke-width="2"
          />

          <template v-if="hoverIndex !== null && coinChartData.data[hoverIndex]">
            <line
              :x1="xScale(hoverIndex, coinChartData.data.length)"
              :y1="padTop"
              :x2="xScale(hoverIndex, coinChartData.data.length)"
              :y2="chartHeight - padBottom"
              stroke="var(--text-muted)"
              stroke-width="1"
              stroke-dasharray="4 2"
            />
            <circle
              :cx="xScale(hoverIndex, coinChartData.data.length)"
              :cy="yScale(coinChartData.data[hoverIndex].price, coinChartData.minVal, coinChartData.maxVal)"
              r="4"
              fill="var(--gold-color)"
              stroke="var(--bg)"
              stroke-width="2"
            />
            <rect
              :x="xScale(hoverIndex, coinChartData.data.length) - 80"
              :y="yScale(coinChartData.data[hoverIndex].price, coinChartData.minVal, coinChartData.maxVal) - 36"
              width="160"
              height="28"
              fill="var(--surface)"
              stroke="var(--border)"
              stroke-width="1"
            />
            <text
              :x="xScale(hoverIndex, coinChartData.data.length)"
              :y="yScale(coinChartData.data[hoverIndex].price, coinChartData.minVal, coinChartData.maxVal) - 18"
              text-anchor="middle"
              class="chart-tooltip"
            >
              {{ formatDate(coinChartData.data[hoverIndex].date) }} — Rs {{ coinChartData.data[hoverIndex].price.toLocaleString() }}
            </text>
          </template>

          <text
            v-for="(d, i) in coinChartData.data.filter((_, idx) => idx % Math.floor(Math.max(coinChartData.data.length / 6, 1)) === 0)"
            :key="'x-' + d.date"
            :x="xScale(coinChartData.data.indexOf(d), coinChartData.data.length)"
            :y="chartHeight - 8"
            text-anchor="middle"
            class="chart-label"
          >
            {{ new Date(d.date).getFullYear() }}
          </text>
        </svg>
        <div v-else class="chart-empty">Not enough data to display chart</div>
      </div>
    </section>

    <!-- Historical Table -->
    <section class="table-section">
      <h3>Recent Prices</h3>
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
  </main>
</template>

<style scoped>
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px;
  flex: 1;
}

.hero {
  margin-bottom: 32px;
}

.hero h2 {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 12px;
}

.hero-sub {
  color: var(--text-secondary);
  font-size: 14px;
  max-width: 500px;
}

.coins-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 2px solid var(--border);
  margin-bottom: 12px;
}

.coin-card {
  padding: 24px;
  border-right: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.1s;
}

.coin-card:last-child {
  border-right: none;
}

.coin-card:hover {
  background: var(--row-hover);
}

.coin-card.active {
  background: var(--text);
  color: var(--bg);
}

.coin-card.active .coin-specs {
  color: var(--bg);
  opacity: 0.6;
}

.coin-denom {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.coin-price {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.coin-specs {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 12px;
}

.coin-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 40px;
}

.chart-section {
  margin-bottom: 48px;
}

.chart-section h3 {
  font-size: 24px;
  margin-bottom: 24px;
}

.chart-container {
  border: 2px solid var(--border);
  padding: 16px;
  background: var(--surface);
}

.chart {
  width: 100%;
  height: auto;
  display: block;
}

.chart-label {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--text-muted);
}

.chart-tooltip {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--text);
  font-weight: 600;
}

.chart-empty {
  padding: 60px;
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
}

.table-section h3 {
  font-size: 24px;
  margin-bottom: 24px;
}

.table-wrap {
  border: 2px solid var(--border);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 13px;
}

thead {
  background: var(--table-header);
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--row-border);
}

tr:hover td {
  background: var(--row-hover);
}

.td-date {
  color: var(--text-secondary);
  white-space: nowrap;
}

.td-price {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .hero h2 {
    font-size: 32px;
  }

  .coins-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .coin-card:nth-child(2) {
    border-right: none;
  }

  .coin-card:nth-child(1),
  .coin-card:nth-child(2) {
    border-bottom: 2px solid var(--border);
  }
}
</style>
