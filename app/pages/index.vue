<script setup lang="ts">
const {
  currentPrice,
  lastChange,
  allTimeHigh,
  allTimeLow,
  chartData,
  coreLoading,
  formatDate,
  formatPrice,
  formatPriceShort,
  timeAgo,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Overview',
})

const hoverIndex = ref<number | null>(null)

const chartWidth = 1000
const chartHeight = 400
const padLeft = 80
const padRight = 24
const padTop = 40
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
    <div v-if="coreLoading" class="loading">Loading gold price data...</div>
    <template v-else-if="currentPrice && lastChange && allTimeHigh && allTimeLow">
    <div class="hero-section">
      <div class="meta-info">
        <span>Updated {{ timeAgo(currentPrice.date) }}</span>
        <span class="divider"></span>
        <span>Bank of Mauritius</span>
      </div>
      <h2 class="main-title">Industrial Gold Prices</h2>
      
      <div class="primary-price-container">
        <div class="price-left">
          <div class="price-label">24 Karat Gold</div>
          <div class="price-value">Rs {{ formatPriceShort(currentPrice.price_per_gram) }}</div>
          <div class="price-unit">per gram</div>
        </div>
        <div class="price-right">
          <div class="price-change" :class="lastChange.change >= 0 ? 'up' : 'down'">
            <svg v-if="lastChange.change >= 0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            <span class="change-amount">{{ Math.abs(lastChange.change) }} ({{ Math.abs(lastChange.changePercent) }}%)</span>
          </div>
          <div class="change-label">Since {{ formatDate(lastChange.sinceDate) }}</div>
        </div>
      </div>
    </div>

    <section class="chart-section">
      <h3 class="section-heading">Historical Performance</h3>
      <div class="chart-wrapper">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="chart"
          @mousemove="onChartHover"
          @mouseleave="onChartLeave"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--gold-color)" stop-opacity="0.2" />
              <stop offset="100%" stop-color="var(--gold-color)" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines -->
          <line
            v-for="tick in yTicks"
            :key="tick"
            :x1="padLeft"
            :y1="yScale(tick, chartData.minVal, chartData.maxVal)"
            :x2="chartWidth - padRight"
            :y2="yScale(tick, chartData.minVal, chartData.maxVal)"
            stroke="var(--border)"
            stroke-width="1"
            stroke-dasharray="2 6"
          />

          <!-- Y-axis labels -->
          <text
            v-for="tick in yTicks"
            :key="'label-' + tick"
            :x="padLeft - 16"
            :y="yScale(tick, chartData.minVal, chartData.maxVal) + 4"
            text-anchor="end"
            class="chart-label"
          >
            {{ tick.toLocaleString() }}
          </text>

          <!-- Area Fill -->
          <path
            :d="chartAreaPath"
            fill="url(#areaGradient)"
          />

          <!-- Line -->
          <path
            :d="chartPath"
            fill="none"
            stroke="var(--gold-color)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- Hover Indicator -->
          <g v-if="hoverIndex !== null" class="hover-group">
            <line
              :x1="xScale(hoverIndex, chartData.data.length)"
              :y1="padTop"
              :x2="xScale(hoverIndex, chartData.data.length)"
              :y2="chartHeight - padBottom"
              stroke="var(--gold-accent)"
              stroke-width="1"
              stroke-dasharray="4 4"
            />
            <circle
              :cx="xScale(hoverIndex, chartData.data.length)"
              :cy="yScale(chartData.data[hoverIndex].price_per_gram, chartData.minVal, chartData.maxVal)"
              r="5"
              fill="var(--bg)"
              stroke="var(--gold-color)"
              stroke-width="2"
            />
            <!-- Tooltip -->
            <g class="tooltip" :transform="`translate(${Math.min(Math.max(xScale(hoverIndex, chartData.data.length), padLeft + 60), chartWidth - padRight - 60)}, ${Math.max(yScale(chartData.data[hoverIndex].price_per_gram, chartData.minVal, chartData.maxVal) - 40, padTop)})`">
              <text x="0" y="-12" text-anchor="middle" class="tooltip-date">{{ formatDate(chartData.data[hoverIndex].date) }}</text>
              <text x="0" y="6" text-anchor="middle" class="tooltip-price">Rs {{ formatPriceShort(chartData.data[hoverIndex].price_per_gram) }}</text>
            </g>
          </g>

          <!-- X-axis labels -->
          <text
            v-for="(d, i) in chartData.data.filter((_, idx) => idx % Math.floor(chartData.data.length / 6) === 0)"
            :key="'x-' + d.date"
            :x="xScale(chartData.data.indexOf(d), chartData.data.length)"
            :y="chartHeight - 12"
            text-anchor="middle"
            class="chart-label"
          >
            {{ new Date(d.date).getFullYear() }}
          </text>
        </svg>
      </div>
    </section>

    <div class="data-split">
      <div class="other-karats">
        <h3 class="section-heading">Other Karats</h3>
        <div class="karat-list">
          <div v-for="k in karats.slice(1)" :key="k" class="list-item">
            <span class="list-label">{{ k.toUpperCase() }}</span>
            <span class="list-value">Rs {{ formatPriceShort(currentPrice.karats[k]) }}</span>
          </div>
        </div>
      </div>

      <div class="historical-stats">
        <h3 class="section-heading">All-Time Statistics</h3>
        <div class="stat-list">
          <div class="list-item">
            <div class="stat-meta">
              <span class="list-label">Highest</span>
              <span class="stat-date">{{ formatDate(allTimeHigh.date) }}</span>
            </div>
            <span class="list-value">Rs {{ formatPriceShort(allTimeHigh.price_per_gram) }}</span>
          </div>
          <div class="list-item">
            <div class="stat-meta">
              <span class="list-label">Lowest</span>
              <span class="stat-date">{{ formatDate(allTimeLow.date) }}</span>
            </div>
            <span class="list-value">Rs {{ formatPriceShort(allTimeLow.price_per_gram) }}</span>
          </div>
        </div>
      </div>
    </div>
    </template>
  </main>
</template>

<style scoped>
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

.primary-price-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border);
}

.price-label {
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.price-value {
  font-family: var(--font-display);
  font-size: 72px;
  font-weight: 500;
  color: var(--gold-color);
  line-height: 0.9;
  margin-bottom: 8px;
}

.price-unit {
  font-size: 16px;
  color: var(--text-muted);
}

.price-right {
  text-align: right;
  padding-bottom: 8px;
}

.price-change {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.price-change.up { color: var(--up-color); }
.price-change.down { color: var(--down-color); }

.change-label {
  font-size: 14px;
  color: var(--text-muted);
}

.data-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  margin-bottom: 80px;
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

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--row-border);
}

.list-item:last-child {
  border-bottom: none;
}

.list-label {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
}

.list-value {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--text);
}

.stat-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-date {
  font-size: 13px;
  color: var(--text-muted);
}

.chart-section {
  margin-bottom: 64px;
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

.loading {
  padding: 120px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

@media (max-width: 768px) {
  .page {
    padding: 40px 16px;
  }

  .main-title {
    font-size: 40px;
  }

  .primary-price-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }

  .price-value {
    font-size: 56px;
  }

  .price-right {
    text-align: left;
  }

  .price-change {
    justify-content: flex-start;
  }

  .data-split {
    grid-template-columns: 1fr;
    gap: 48px;
  }
}
</style>
