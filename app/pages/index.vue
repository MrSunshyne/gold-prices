<script setup lang="ts">
const {
  currentPrice,
  lastChange,
  allTimeHigh,
  allTimeLow,
  chartData,
  formatDate,
  formatPrice,
  formatPriceShort,
  timeAgo,
  prices,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Overview',
})

const hoverIndex = ref<number | null>(null)

const chartWidth = 900
const chartHeight = 340
const padLeft = 80
const padRight = 24
const padTop = 24
const padBottom = 40

function xScale(i: number, total: number): number {
  return padLeft + (i / (total - 1)) * (chartWidth - padLeft - padRight)
}

function yScale(val: number, min: number, max: number): number {
  return padTop + (1 - (val - min) / (max - min)) * (chartHeight - padTop - padBottom)
}

const chartPath = computed(() => {
  const { data, minVal, maxVal } = chartData.value
  if (data.length < 2) return ''
  return data.map((d, i) => {
    const x = xScale(i, data.length)
    const y = yScale(d.price_per_gram, minVal, maxVal)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

const chartAreaPath = computed(() => {
  const { data, minVal, maxVal } = chartData.value
  if (data.length < 2) return ''
  const bottom = chartHeight - padBottom
  const points = data.map((d, i) => {
    const x = xScale(i, data.length)
    const y = yScale(d.price_per_gram, minVal, maxVal)
    return `${x},${y}`
  })
  const firstX = xScale(0, data.length)
  const lastX = xScale(data.length - 1, data.length)
  return `M${firstX},${bottom} L${points.join(' L')} L${lastX},${bottom} Z`
})

const yTicks = computed(() => {
  const { minVal, maxVal } = chartData.value
  const range = maxVal - minVal
  const step = range <= 2000 ? 500 : range <= 5000 ? 1000 : 2000
  const ticks = []
  for (let v = minVal; v <= maxVal; v += step) {
    ticks.push(v)
  }
  return ticks
})

function onChartHover(event: MouseEvent) {
  const svg = (event.currentTarget as SVGElement)
  const rect = svg.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const { data } = chartData.value
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

const karats = ['24k', '22k', '21k', '18k'] as const
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="hero-meta">
        <span class="badge">Bank of Mauritius</span>
        <span class="badge">{{ prices.length }} records</span>
        <span class="badge">Since 2004</span>
      </div>
      <h2>Gold Price Index</h2>
      <p class="hero-sub">Industrial gold prices in Mauritius, updated daily from the Bank of Mauritius.</p>
    </section>

    <section class="bento">
      <!-- Current Price Card -->
      <div class="card card-main">
        <div class="card-label">Current Price (24K)</div>
        <div class="card-price">{{ formatPriceShort(currentPrice.price_per_gram) }}</div>
        <div class="card-unit">MUR / gram</div>
        <div class="card-change" :class="lastChange.change >= 0 ? 'up' : 'down'">
          <span>{{ lastChange.change >= 0 ? '&#9650;' : '&#9660;' }}</span>
          {{ lastChange.change >= 0 ? '+' : '' }}{{ formatPriceShort(lastChange.change) }}
          <span class="change-pct">({{ lastChange.changePercent >= 0 ? '+' : '' }}{{ lastChange.changePercent }}%)</span>
        </div>
        <div class="card-date">As of {{ formatDate(currentPrice.date) }}</div>
      </div>

      <!-- Karat Cards -->
      <div v-for="k in karats" :key="k" class="card card-karat">
        <div class="card-label">{{ k.toUpperCase() }}</div>
        <div class="card-karat-price">{{ formatPriceShort(currentPrice.karats[k]) }}</div>
        <div class="card-unit">MUR / gram</div>
      </div>

      <!-- Stats -->
      <div class="card card-stat">
        <div class="card-label">All-Time High</div>
        <div class="card-stat-price">{{ formatPrice(allTimeHigh.price_per_gram) }}</div>
        <div class="card-date">{{ formatDate(allTimeHigh.date) }}</div>
      </div>
      <div class="card card-stat">
        <div class="card-label">All-Time Low</div>
        <div class="card-stat-price">{{ formatPrice(allTimeLow.price_per_gram) }}</div>
        <div class="card-date">{{ formatDate(allTimeLow.date) }}</div>
      </div>
      <div class="card card-stat">
        <div class="card-label">Last Changed</div>
        <div class="card-stat-price">{{ timeAgo(lastChange.sinceDate) }}</div>
        <div class="card-date">{{ formatDate(lastChange.sinceDate) }}</div>
      </div>
    </section>

    <!-- Price Chart -->
    <section class="chart-section">
      <h3>Price History</h3>
      <div class="chart-container">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="chart"
          @mousemove="onChartHover"
          @mouseleave="onChartLeave"
        >
          <!-- Grid lines -->
          <line
            v-for="tick in yTicks"
            :key="tick"
            :x1="padLeft"
            :y1="yScale(tick, chartData.minVal, chartData.maxVal)"
            :x2="chartWidth - padRight"
            :y2="yScale(tick, chartData.minVal, chartData.maxVal)"
            stroke="var(--row-border)"
            stroke-width="1"
          />

          <!-- Y-axis labels -->
          <text
            v-for="tick in yTicks"
            :key="'label-' + tick"
            :x="padLeft - 8"
            :y="yScale(tick, chartData.minVal, chartData.maxVal) + 4"
            text-anchor="end"
            class="chart-label"
          >
            {{ tick.toLocaleString() }}
          </text>

          <!-- Area fill -->
          <path
            :d="chartAreaPath"
            fill="var(--gold-color)"
            opacity="0.1"
          />

          <!-- Price line -->
          <path
            :d="chartPath"
            fill="none"
            stroke="var(--gold-color)"
            stroke-width="2"
          />

          <!-- Hover indicator -->
          <template v-if="hoverIndex !== null">
            <line
              :x1="xScale(hoverIndex, chartData.data.length)"
              :y1="padTop"
              :x2="xScale(hoverIndex, chartData.data.length)"
              :y2="chartHeight - padBottom"
              stroke="var(--text-muted)"
              stroke-width="1"
              stroke-dasharray="4 2"
            />
            <circle
              :cx="xScale(hoverIndex, chartData.data.length)"
              :cy="yScale(chartData.data[hoverIndex].price_per_gram, chartData.minVal, chartData.maxVal)"
              r="4"
              fill="var(--gold-color)"
              stroke="var(--bg)"
              stroke-width="2"
            />
            <rect
              :x="xScale(hoverIndex, chartData.data.length) - 80"
              :y="yScale(chartData.data[hoverIndex].price_per_gram, chartData.minVal, chartData.maxVal) - 36"
              width="160"
              height="28"
              fill="var(--surface)"
              stroke="var(--border)"
              stroke-width="1"
            />
            <text
              :x="xScale(hoverIndex, chartData.data.length)"
              :y="yScale(chartData.data[hoverIndex].price_per_gram, chartData.minVal, chartData.maxVal) - 18"
              text-anchor="middle"
              class="chart-tooltip"
            >
              {{ formatDate(chartData.data[hoverIndex].date) }} — Rs {{ formatPriceShort(chartData.data[hoverIndex].price_per_gram) }}
            </text>
          </template>

          <!-- X-axis labels -->
          <text
            v-for="(d, i) in chartData.data.filter((_, idx) => idx % Math.floor(chartData.data.length / 6) === 0)"
            :key="'x-' + d.date"
            :x="xScale(chartData.data.indexOf(d), chartData.data.length)"
            :y="chartHeight - 8"
            text-anchor="middle"
            class="chart-label"
          >
            {{ new Date(d.date).getFullYear() }}
          </text>
        </svg>
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
  margin-bottom: 40px;
}

.hero-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.badge {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 4px 10px;
  border: 1.5px solid var(--border);
  color: var(--text-secondary);
  letter-spacing: 0.05em;
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

.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border: 2px solid var(--border);
  margin-bottom: 48px;
}

.card {
  padding: 24px;
  border-right: 2px solid var(--border);
  border-bottom: 2px solid var(--border);
  transition: background 0.1s;
}

.card:hover {
  background: var(--row-hover);
}

.card:nth-child(4n) {
  border-right: none;
}

.card-main {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.card-price {
  font-family: var(--font-mono);
  font-size: 56px;
  font-weight: 700;
  color: var(--gold-color);
  line-height: 1;
  margin-bottom: 4px;
}

.card-karat-price {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 4px;
}

.card-unit {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.card-change {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-change.up {
  color: var(--up-color);
}

.card-change.down {
  color: var(--down-color);
}

.change-pct {
  font-size: 12px;
  opacity: 0.8;
}

.card-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.card-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-stat-price {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
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

@media (max-width: 768px) {
  .hero h2 {
    font-size: 32px;
  }

  .bento {
    grid-template-columns: 1fr;
  }

  .card-main {
    grid-column: span 1;
    grid-row: span 1;
  }

  .card {
    border-right: none;
  }

  .card-price {
    font-size: 36px;
  }
}
</style>
