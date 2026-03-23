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

const selectedForm = ref<'Grains' | 'Bar'>('Grains')

const displayPrice = computed(() => {
  if (!currentPrice.value) return null
  if (selectedForm.value === 'Grains') return currentPrice.value.price_per_gram
  const barForm = currentPrice.value.forms?.find(f => f.form === 'Bar')
  return barForm?.price_per_gm ?? currentPrice.value.price_per_gram
})

const displayKarats = computed(() => {
  const base = displayPrice.value
  if (!base) return null
  return {
    '22k': Math.round(base * 22 / 24 * 100) / 100,
    '21k': Math.round(base * 21 / 24 * 100) / 100,
    '18k': Math.round(base * 18 / 24 * 100) / 100,
  }
})

useHead({
  title: 'Mauritius Gold Price Index — Overview',
})

const hoverIndex = ref<number | null>(null)

const rangeOptions = [
  { label: '1M', months: 1 },
  { label: '1Y', months: 12 },
  { label: '5Y', months: 60 },
  { label: '10Y', months: 120 },
  { label: 'All', months: 0 },
] as const

const selectedRange = ref(12)

const filteredChartData = computed(() => {
  const { data, minVal, maxVal } = chartData.value
  if (data.length === 0) return { data: [], minVal: 0, maxVal: 0 }
  if (selectedRange.value === 0) return { data, minVal, maxVal }
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - selectedRange.value)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const filtered = data.filter(d => d.date >= cutoffStr)
  if (filtered.length < 2) return { data, minVal, maxVal }
  const values = filtered.map(d => d.price_per_gram)
  return {
    data: filtered,
    minVal: Math.floor(Math.min(...values) / 500) * 500,
    maxVal: Math.ceil(Math.max(...values) / 500) * 500,
  }
})

const chartWidth = 1200
const chartHeight = 500
const padLeft = 90
const padRight = 10
const padTop = 40
const padBottom = 56

function xScale(i: number, total: number): number {
  return padLeft + (i / (total - 1)) * (chartWidth - padLeft - padRight)
}

function yScale(val: number, min: number, max: number): number {
  return padTop + (1 - (val - min) / (max - min)) * (chartHeight - padTop - padBottom)
}

const chartPath = computed(() => {
  const { data, minVal, maxVal } = filteredChartData.value
  if (data.length < 2) return ''
  return data.map((d, i) => {
    const x = xScale(i, data.length)
    const y = yScale(d.price_per_gram, minVal, maxVal)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

const chartAreaPath = computed(() => {
  const { data, minVal, maxVal } = filteredChartData.value
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
  const { minVal, maxVal } = filteredChartData.value
  const range = maxVal - minVal
  const step = range <= 2000 ? 500 : range <= 5000 ? 1000 : 2000
  const ticks = []
  for (let v = minVal; v <= maxVal; v += step) {
    ticks.push(v)
  }
  return ticks
})

function getClosestIndex(clientX: number, svgEl: SVGElement) {
  const rect = svgEl.getBoundingClientRect()
  const mouseX = clientX - rect.left
  const { data } = filteredChartData.value
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
  return closest
}

function onChartHover(event: MouseEvent) {
  hoverIndex.value = getClosestIndex(event.clientX, event.currentTarget as SVGElement)
}

function onChartTouch(event: TouchEvent) {
  if (event.touches.length > 0) {
    hoverIndex.value = getClosestIndex(event.touches[0].clientX, event.currentTarget as SVGElement)
  }
}

function onChartLeave() {
  hoverIndex.value = null
}

const hoveredEntry = computed(() => {
  if (hoverIndex.value === null) return null
  const d = filteredChartData.value.data[hoverIndex.value]
  return d ?? null
})
</script>

<template>
  <main class="luxury-page">
    <div class="hero-container" v-if="currentPrice && allTimeHigh && allTimeLow && lastChange">
      <div class="hero-content">
        <div class="meta-badge">
          <span>Updated {{ timeAgo(currentPrice.date) }}</span>
        </div>
        
        <h1 class="massive-title">
          <span class="text-light">Industrial</span><br/>
          Gold
        </h1>

        <div class="price-showcase">
          <div class="form-toggle">
            <button :class="{ active: selectedForm === 'Grains' }" @click="selectedForm = 'Grains'">Grains</button>
            <button :class="{ active: selectedForm === 'Bar' }" @click="selectedForm = 'Bar'">Bar</button>
          </div>
          <div class="price-huge">Rs {{ formatPriceShort(displayPrice) }}</div>
          <div class="price-desc">Current value per gram — {{ selectedForm }} price</div>
          
          <div class="trend-indicator" :class="lastChange.change >= 0 ? 'up' : 'down'">
            <svg v-if="lastChange.change >= 0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            <span class="trend-val">Rs {{ formatPriceShort(Math.abs(lastChange.change)) }} ({{ Math.abs(lastChange.changePercent) }}%)</span>
            <span class="trend-date">{{ lastChange.change < 0 ? 'from peak' : 'from low' }} {{ formatDate(lastChange.sinceDate) }}</span>
          </div>
        </div>

        <div class="purity-grid">
          <div class="purity-item">
            <span class="p-label">22K Gold</span>
            <span class="p-val">Rs {{ formatPriceShort(displayKarats?.['22k']) }}</span>
          </div>
          <div class="purity-item">
            <span class="p-label">21K Gold</span>
            <span class="p-val">Rs {{ formatPriceShort(displayKarats?.['21k']) }}</span>
          </div>
          <div class="purity-item">
            <span class="p-label">18K Gold</span>
            <span class="p-val">Rs {{ formatPriceShort(displayKarats?.['18k']) }}</span>
          </div>
          <div class="purity-item highlight">
            <span class="p-label">All-Time High</span>
            <span class="p-val">Rs {{ formatPriceShort(allTimeHigh.price_per_gram) }}</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="glass-chart-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <h3>Historical Valuation</h3>
              <p>24K Gold Price Trajectory</p>
            </div>
            <div class="range-switcher">
              <button
                v-for="opt in rangeOptions"
                :key="opt.label"
                :class="{ active: selectedRange === opt.months }"
                @click="selectedRange = opt.months; hoverIndex = null"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="interactive-chart"
            @mousemove="onChartHover"
            @mouseleave="onChartLeave"
            @touchmove.prevent="onChartTouch"
            @touchend="onChartLeave"
          >
            <defs>
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Grid -->
            <line
              v-for="tick in yTicks"
              :key="tick"
              :x1="padLeft"
              :y1="yScale(tick, filteredChartData.minVal, filteredChartData.maxVal)"
              :x2="chartWidth - padRight"
              :y2="yScale(tick, filteredChartData.minVal, filteredChartData.maxVal)"
              stroke="var(--border)"
              stroke-width="1"
              stroke-dasharray="4 4"
              opacity="0.5"
            />

            <text
              v-for="tick in yTicks"
              :key="'label-' + tick"
              :x="padLeft - 16"
              :y="yScale(tick, filteredChartData.minVal, filteredChartData.maxVal) + 4"
              text-anchor="end"
              class="chart-axis-text"
            >
              {{ tick.toLocaleString() }}
            </text>

            <path
              :d="chartPath"
              fill="none"
              stroke="var(--gold-color)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              filter="url(#lineGlow)"
            />

            <!-- Hover -->
            <g v-if="hoverIndex !== null" class="hover-group">
              <line
                :x1="xScale(hoverIndex, filteredChartData.data.length)"
                :y1="padTop - 10"
                :x2="xScale(hoverIndex, filteredChartData.data.length)"
                :y2="chartHeight - padBottom"
                stroke="var(--gold-accent)"
                stroke-width="1"
                stroke-dasharray="4 4"
              />
              <circle
                :cx="xScale(hoverIndex, filteredChartData.data.length)"
                :cy="yScale(filteredChartData.data[hoverIndex].price_per_gram, filteredChartData.minVal, filteredChartData.maxVal)"
                r="6"
                fill="var(--bg)"
                stroke="var(--gold-color)"
                stroke-width="3"
              />
              
              <g class="chart-tooltip" :transform="`translate(${Math.min(Math.max(xScale(hoverIndex, filteredChartData.data.length), padLeft + 70), chartWidth - padRight - 70)}, ${Math.max(yScale(filteredChartData.data[hoverIndex].price_per_gram, filteredChartData.minVal, filteredChartData.maxVal) - 50, padTop)})`">
                <rect x="-70" y="-35" width="140" height="50" rx="8" class="tooltip-bg" />
                <text x="0" y="-15" text-anchor="middle" class="tooltip-date">{{ formatDate(filteredChartData.data[hoverIndex].date) }}</text>
                <text x="0" y="5" text-anchor="middle" class="tooltip-price">Rs {{ formatPriceShort(filteredChartData.data[hoverIndex].price_per_gram) }}</text>
              </g>
            </g>

            <text
              v-for="(d, i) in filteredChartData.data.filter((_, idx) => idx % Math.floor(filteredChartData.data.length / 5) === 0)"
              :key="'x-' + d.date"
              :x="xScale(filteredChartData.data.indexOf(d), filteredChartData.data.length)"
              :y="chartHeight - 12"
              text-anchor="middle"
              class="chart-axis-text"
            >
              {{ new Date(d.date).getFullYear() }}
            </text>
          </svg>

          <!-- Mobile tooltip below chart -->
          <div v-if="hoveredEntry" class="mobile-tooltip">
            <span class="mobile-tooltip-date">{{ formatDate(hoveredEntry.date) }}</span>
            <span class="mobile-tooltip-price">Rs {{ formatPriceShort(hoveredEntry.price_per_gram) }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.luxury-page {
  position: relative;
  overflow-x: hidden;
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
}

.luxury-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background-size: 40px 40px;
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  mask-image: linear-gradient(to right, black 5%, transparent 60%);
  -webkit-mask-image: linear-gradient(to right, black 5%, transparent 60%);
}

html.dark .luxury-page::before {
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}

.hero-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 24px;
  display: grid;
  grid-template-columns: minmax(400px, 1fr) 1.5fr;
  gap: 80px;
  align-items: center;
  z-index: 1;
}

.hero-content {
  /* No custom padding-left */
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--gold-accent);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 32px;
}

html.dark .meta-badge {
  color: var(--gold-light);
}

.massive-title {
  font-family: var(--font-display);
  font-size: 110px;
  line-height: 0.9;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 48px;
  letter-spacing: -0.02em;
}

.text-light {
  font-weight: 300;
  font-style: italic;
  color: var(--text-secondary);
}

.price-showcase {
  margin-bottom: 48px;
}

.price-huge {
  font-family: var(--font-display);
  font-size: 64px;
  font-weight: 600;
  color: var(--gold-color);
  line-height: 1;
  margin-bottom: 8px;
}

html.dark .price-huge {
  color: var(--gold-light);
}

.price-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.trend-indicator.up { color: var(--up-color); }
.trend-indicator.down { color: var(--down-color); }

.trend-date {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 14px;
}

.purity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.purity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 16px;
  border-left: 2px solid var(--border);
}

.purity-item.highlight {
  border-left-color: var(--gold-color);
}

.p-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.p-val {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
}

.hero-visual {
  position: relative;
  width: 100%;
  height: 500px;
  display: flex;
  align-items: center;
}

.glass-chart-panel {
  padding: 0;
  padding-right: 24px;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  position: absolute;
  left: 0;
  /* Precisely span to the viewport right edge: 100% of grid cell + 24px container padding + auto margin */
  width: calc(100% + max(0px, 50vw - 700px) + 24px);
  box-sizing: border-box;
}

html.dark .glass-chart-panel {
  background: transparent;
  border: none;
  box-shadow: none;
}

.panel-header {
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.panel-title-group h3 {
  font-size: 24px;
  margin-bottom: 4px;
}

.panel-title-group p {
  color: var(--text-secondary);
  font-size: 14px;
}

.form-toggle {
  display: inline-flex;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
}

.form-toggle button {
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.form-toggle button:first-child {
  border-right: 1.5px solid var(--border);
}

.form-toggle button:hover {
  color: var(--text);
}

.form-toggle button.active {
  background: var(--gold-color);
  color: #fff;
  font-weight: 600;
}

html.dark .form-toggle button.active {
  color: #000;
}

.range-switcher {
  display: flex;
  gap: 20px;
}

.range-switcher button {
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.range-switcher button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 2px;
  background-color: var(--gold-color);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.range-switcher button:hover {
  color: var(--text);
}

.range-switcher button.active {
  color: var(--gold-color);
  font-weight: 600;
}

.range-switcher button.active::after {
  width: 100%;
}

.interactive-chart {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.chart-axis-text {
  font-size: 12px;
  fill: var(--text-muted);
  font-family: var(--font);
}

.tooltip-bg {
  fill: var(--bg);
  stroke: var(--border);
  stroke-width: 1;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
}

html.dark .tooltip-bg {
  fill: #111;
  stroke: rgba(212, 175, 55, 0.3);
}

.tooltip-date {
  font-size: 11px;
  fill: var(--text-muted);
  font-family: var(--font);
}

.tooltip-price {
  font-size: 15px;
  font-weight: 700;
  fill: var(--text);
  font-family: var(--font-display);
}

.mobile-tooltip {
  display: none;
}

@media (max-width: 1024px) {
  .massive-title {
    font-size: 80px;
  }
  .hero-container {
    grid-template-columns: 1fr;
    gap: 48px;
    padding-top: 64px;
    padding-bottom: 64px;
  }
  .hero-visual {
    height: auto;
    display: block;
    position: relative;
  }
  .glass-chart-panel {
    position: relative;
    width: 100%;
    left: auto;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .luxury-page {
    min-height: auto;
  }
  .massive-title {
    font-size: 64px;
  }
  .price-huge {
    font-size: 48px;
  }
  .glass-chart-panel {
    padding: 24px 16px;
    border-radius: 24px;
  }
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .range-switcher {
    width: 100%;
  }
  .range-switcher button {
    flex: 1;
    text-align: center;
  }
  .form-toggle {
    align-self: center;
  }
  .chart-axis-text {
    font-size: 36px;
  }
  .chart-tooltip {
    display: none;
  }
  .mobile-tooltip {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    min-height: 44px;
    font-family: var(--font);
  }
  .mobile-tooltip-date {
    font-size: 14px;
    color: var(--text-muted);
  }
  .mobile-tooltip-price {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    font-family: var(--font-display);
  }
}
</style>
