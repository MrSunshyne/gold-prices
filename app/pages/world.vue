<script setup lang="ts">
const {
  international,
  fetchInternational,
  grainsPriceOn,
  formatDate,
  formatPrice,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Mauritius vs World Gold Price',
})

onMounted(() => {
  fetchInternational()
})

// Single days are noisy (BOM prices after the overnight move), so the headline
// and chart use the median of the last ROLLING_DAYS business days
const ROLLING_DAYS = 20

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const latest = computed(() => {
  const data = international.value
  if (!data) return null
  const i = data.dates.length - 1
  return {
    date: data.dates[i],
    usdPerOz: data.comex_usd_per_oz[i],
    usdMur: data.usd_mur[i],
    worldPrice: data.world_price_per_gram[i],
    bomPrice: grainsPriceOn(data.dates[i]),
    premium: data.premium_pct[i],
    rollingPremium: median(data.premium_pct.slice(-ROLLING_DAYS)),
  }
})

// Rolling median premium, oldest first
const premiumSeries = computed(() => {
  const data = international.value
  if (!data) return []
  return data.dates.slice(ROLLING_DAYS - 1).map((date, n) => ({
    date,
    premium: median(data.premium_pct.slice(n, n + ROLLING_DAYS)),
  }))
})

const yearly = computed(() => {
  const data = international.value
  if (!data) return []
  const byYear = new Map<string, number[]>()
  data.dates.forEach((date, i) => {
    const year = date.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(data.premium_pct[i])
  })
  return [...byYear].reverse().map(([year, values]) => ({ year, median: median(values), days: values.length }))
})

const chartWidth = 1000
const chartHeight = 360
const padLeft = 70
const padRight = 24
const padTop = 40
const padBottom = 40

const chartRange = computed(() => {
  const values = premiumSeries.value.map(d => d.premium)
  if (values.length === 0) return { minVal: 0, maxVal: 0, step: 1 }
  const minVal = Math.min(0, Math.floor(Math.min(...values)))
  const maxVal = Math.ceil(Math.max(...values))
  return { minVal, maxVal, step: maxVal - minVal <= 6 ? 1 : 2 }
})

function xScale(i: number, total: number): number {
  return padLeft + (i / Math.max(total - 1, 1)) * (chartWidth - padLeft - padRight)
}

function yScale(val: number): number {
  const { minVal, maxVal } = chartRange.value
  if (maxVal === minVal) return (padTop + chartHeight - padBottom) / 2
  return padTop + (1 - (val - minVal) / (maxVal - minVal)) * (chartHeight - padTop - padBottom)
}

const premiumPath = computed(() => {
  const data = premiumSeries.value
  if (data.length < 2) return ''
  return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i, data.length)},${yScale(d.premium)}`).join(' ')
})

const yTicks = computed(() => {
  const { minVal, maxVal, step } = chartRange.value
  const ticks = []
  for (let v = minVal; v <= maxVal; v += step) ticks.push(v)
  return ticks
})

// One label at the start of every few years, at most 6
const xLabels = computed(() => {
  const data = premiumSeries.value
  const starts: number[] = []
  for (let i = 1; i < data.length; i++) {
    if (data[i].date.slice(0, 4) !== data[i - 1].date.slice(0, 4)) starts.push(i)
  }
  const step = Math.ceil(starts.length / 6)
  return starts.filter((_, n) => n % step === 0).map(i => ({ i, label: data[i].date.slice(0, 4) }))
})

const hoverIndex = ref<number | null>(null)

function onChartHover(event: MouseEvent) {
  const svg = event.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const x = (event.clientX - rect.left) * (chartWidth / rect.width)
  const total = premiumSeries.value.length
  const i = Math.round(((x - padLeft) / (chartWidth - padLeft - padRight)) * (total - 1))
  hoverIndex.value = Math.min(Math.max(i, 0), total - 1)
}

function onChartLeave() {
  hoverIndex.value = null
}
</script>

<template>
  <main class="page">
    <div v-if="!latest" class="loading">Loading world prices...</div>
    <template v-else>
      <div class="hero-section">
        <div class="meta-info">
          <span>Updated {{ formatDate(latest.date) }}</span>
          <span class="divider"></span>
          <span>COMEX gold &amp; Bank of Mauritius</span>
        </div>
        <h2 class="main-title">Mauritius vs World Gold</h2>
        <p class="lead">
          How much more the Bank of Mauritius charges for industrial gold than the international gold price converted to rupees.
        </p>
      </div>

      <section class="stats-section">
        <div class="stat-grid">
          <div class="stat">
            <span class="stat-label">Premium, {{ ROLLING_DAYS }}-day median</span>
            <span class="stat-value">{{ formatPct(latest.rollingPremium) }}</span>
            <span class="stat-sub">{{ formatDate(latest.date) }}: {{ formatPct(latest.premium) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Bank of Mauritius</span>
            <span class="stat-value">{{ latest.bomPrice === null ? '…' : formatPrice(latest.bomPrice) }}</span>
            <span class="stat-sub">per gram, 24K Grains</span>
          </div>
          <div class="stat">
            <span class="stat-label">World price in rupees</span>
            <span class="stat-value">{{ formatPrice(latest.worldPrice) }}</span>
            <span class="stat-sub">US$ {{ latest.usdPerOz.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}/oz × Rs {{ latest.usdMur.toFixed(4) }}/US$</span>
          </div>
        </div>
      </section>

      <section class="chart-section">
        <h3 class="section-heading">Premium over the world price — {{ ROLLING_DAYS }}-day median</h3>
        <div class="chart-wrapper">
          <svg
            v-if="premiumSeries.length >= 2"
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="chart"
            @mousemove="onChartHover"
            @mouseleave="onChartLeave"
          >
            <line
              v-for="tick in yTicks"
              :key="tick"
              :x1="padLeft"
              :y1="yScale(tick)"
              :x2="chartWidth - padRight"
              :y2="yScale(tick)"
              stroke="var(--border)"
              stroke-width="1"
              :stroke-dasharray="tick === 0 ? undefined : '2 6'"
            />
            <text
              v-for="tick in yTicks"
              :key="'label-' + tick"
              :x="padLeft - 16"
              :y="yScale(tick) + 4"
              text-anchor="end"
              class="chart-label"
            >
              {{ tick }}%
            </text>
            <path
              :d="premiumPath"
              fill="none"
              stroke="var(--gold-color)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <g v-if="hoverIndex !== null && premiumSeries[hoverIndex]" class="hover-group">
              <line
                :x1="xScale(hoverIndex, premiumSeries.length)"
                :y1="padTop"
                :x2="xScale(hoverIndex, premiumSeries.length)"
                :y2="chartHeight - padBottom"
                stroke="var(--gold-accent)"
                stroke-width="1"
                stroke-dasharray="4 4"
              />
              <circle
                :cx="xScale(hoverIndex, premiumSeries.length)"
                :cy="yScale(premiumSeries[hoverIndex].premium)"
                r="5"
                fill="var(--bg)"
                stroke="var(--gold-color)"
                stroke-width="2"
              />
              <g class="tooltip" :transform="`translate(${Math.min(Math.max(xScale(hoverIndex, premiumSeries.length), padLeft + 60), chartWidth - padRight - 60)}, ${Math.max(yScale(premiumSeries[hoverIndex].premium) - 40, padTop)})`">
                <text x="0" y="-12" text-anchor="middle" class="tooltip-date">{{ formatDate(premiumSeries[hoverIndex].date) }}</text>
                <text x="0" y="6" text-anchor="middle" class="tooltip-price">{{ formatPct(premiumSeries[hoverIndex].premium) }}</text>
              </g>
            </g>
            <text
              v-for="lbl in xLabels"
              :key="'x-' + lbl.label"
              :x="xScale(lbl.i, premiumSeries.length)"
              :y="chartHeight - 12"
              text-anchor="middle"
              class="chart-label"
            >
              {{ lbl.label }}
            </text>
          </svg>
        </div>
      </section>

      <section class="table-section">
        <h3 class="section-heading">Median premium by year</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Median premium</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in yearly" :key="row.year">
                <td class="td-date">{{ row.year }}</td>
                <td class="td-price">{{ formatPct(row.median) }}</td>
                <td class="td-date">{{ row.days }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="method">
        <h3 class="section-heading">How this is calculated</h3>
        <p>
          The world price is the COMEX gold futures (front month) closing price from the New York session before each BOM date, converted with the Bank of Mauritius consolidated indicative US dollar selling rate for that date, and divided by 31.1035 grams per troy ounce.
          The premium compares it with BOM's 24K Grains price.
        </p>
        <p>
          BOM sets its price in the Mauritius morning, after gold has moved overnight, and futures trade slightly above spot. Single days can be off by a few percent either way; the {{ ROLLING_DAYS }}-day median smooths that out.
          Data: <a href="https://github.com/MrSunshyne/mauritius-dataset-gold#datainternationaljson" target="_blank" rel="noopener noreferrer">mauritius-dataset-gold</a>.
        </p>
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
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.lead {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 640px;
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

.stats-section {
  margin-bottom: 80px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 2px solid var(--border);
  padding-left: 16px;
}

.stat:first-child {
  border-left-color: var(--gold-color);
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  color: var(--text);
}

.stat:first-child .stat-value {
  color: var(--gold-color);
}

.stat-sub {
  font-size: 13px;
  color: var(--text-muted);
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

.table-section {
  margin-bottom: 80px;
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
  padding: 16px 0;
  font-size: 16px;
  font-family: var(--font-display);
  border-bottom: 1px solid var(--row-border);
  color: var(--text);
}

tbody tr:last-child td {
  border-bottom: none;
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

.method {
  margin-bottom: 40px;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 720px;
}

.method p + p {
  margin-top: 12px;
}

.method a {
  color: var(--text);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .page {
    padding: 40px 16px;
  }

  .main-title {
    font-size: 40px;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
