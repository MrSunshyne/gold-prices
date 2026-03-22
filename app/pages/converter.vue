<script setup lang="ts">
const { currentPrice, formatPriceShort, formatDate, timeAgo, coreLoading } = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Carat Converter',
})

interface CaratSpec {
  label: string
  karat: number
  purity: number
  dataKey: '24k' | '22k' | '21k' | '18k' | null
}

const CARATS: CaratSpec[] = [
  { label: '24K', karat: 24, purity: 24 / 24, dataKey: '24k' },
  { label: '22K', karat: 22, purity: 22 / 24, dataKey: '22k' },
  { label: '21K', karat: 21, purity: 21 / 24, dataKey: '21k' },
  { label: '18K', karat: 18, purity: 18 / 24, dataKey: '18k' },
  { label: '14K', karat: 14, purity: 14 / 24, dataKey: null },
  { label: '10K', karat: 10, purity: 10 / 24, dataKey: null },
  { label: '9K', karat: 9, purity: 9 / 24, dataKey: null },
]

const UNITS = [
  { label: 'Grams', short: 'g', toGrams: 1 },
  { label: 'Troy oz', short: 'oz', toGrams: 31.1035 },
  { label: 'Tola', short: 'tola', toGrams: 11.6638 },
]

const weight = ref<number | null>(1)
const selectedUnit = ref('g')

const weightInGrams = computed(() => {
  const w = weight.value ?? 0
  const unit = UNITS.find(u => u.short === selectedUnit.value)!
  return w * unit.toGrams
})

function pricePerGram(spec: CaratSpec): number {
  if (!currentPrice.value) return 0
  if (spec.dataKey === '24k') return currentPrice.value.price_per_gram
  if (spec.dataKey) return currentPrice.value.karats[spec.dataKey]
  return currentPrice.value.price_per_gram * spec.purity
}

function totalPrice(spec: CaratSpec): number {
  return pricePerGram(spec) * weightInGrams.value
}

const purityPercent = (spec: CaratSpec) => (spec.purity * 100).toFixed(2).replace(/\.?0+$/, '') + '%'

const hoveredKarat = ref<string | null>(null)
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <header class="page-header">
        <div class="header-meta">
          <span v-if="currentPrice">Updated {{ timeAgo(currentPrice.date) }}</span>
          <span v-else-if="coreLoading">Loading…</span>
        </div>
        <h1 class="page-title">
          <span class="title-light">Carat</span><br />
          Converter
        </h1>
        <p class="page-subtitle">
          Calculate the industrial market value of gold across different carats,
          based on the latest Bank of Mauritius prices.
        </p>
        <div v-if="currentPrice" class="base-price-row">
          <span class="base-label">24K reference price</span>
          <span class="base-value">Rs {{ formatPriceShort(currentPrice.price_per_gram) }}<span class="base-unit">/g</span></span>
          <span class="base-date">as of {{ formatDate(currentPrice.date) }}</span>
        </div>
      </header>

      <section class="input-section">
        <div class="weight-group">
          <label class="weight-label">Weight</label>
          <div class="weight-input-row">
            <input
              v-model.number="weight"
              type="number"
              min="0"
              step="0.01"
              class="weight-input"
              placeholder="0"
            />
            <div class="unit-toggle">
              <button
                v-for="u in UNITS"
                :key="u.short"
                :class="{ active: selectedUnit === u.short }"
                @click="selectedUnit = u.short"
              >
                {{ u.label }}
              </button>
            </div>
          </div>
          <p v-if="selectedUnit !== 'g' && (weight ?? 0) > 0" class="weight-equiv">
            = {{ weightInGrams.toFixed(4) }} g
          </p>
        </div>
      </section>

      <section class="results-section">
        <div
          v-if="!currentPrice && !coreLoading"
          class="no-data"
        >
          Could not load price data.
        </div>

        <div v-else-if="coreLoading" class="loading-state">
          <div class="loading-bar" />
        </div>

        <div v-else class="carat-grid">
          <div
            v-for="spec in CARATS"
            :key="spec.label"
            class="carat-card"
            :class="{ hovered: hoveredKarat === spec.label, 'is-24k': spec.karat === 24 }"
            @mouseenter="hoveredKarat = spec.label"
            @mouseleave="hoveredKarat = null"
          >
            <div class="card-top">
              <div class="karat-badge" :class="`k-${spec.karat}`">{{ spec.label }}</div>
              <div class="purity-bar-wrap">
                <div class="purity-bar-track">
                  <div
                    class="purity-bar-fill"
                    :style="{ width: `${spec.purity * 100}%` }"
                  />
                </div>
                <span class="purity-pct">{{ purityPercent(spec) }}</span>
              </div>
            </div>

            <div class="card-prices">
              <div class="price-line">
                <span class="price-desc">per gram</span>
                <span class="price-val">Rs {{ formatPriceShort(pricePerGram(spec)) }}</span>
              </div>
              <div class="price-line total" v-if="(weight ?? 0) > 0">
                <span class="price-desc">
                  {{ (weight ?? 0).toLocaleString() }} {{ selectedUnit }}
                  <template v-if="selectedUnit !== 'g'">
                    ({{ weightInGrams.toFixed(2) }}g)
                  </template>
                </span>
                <span class="price-val total-val">Rs {{ formatPriceShort(totalPrice(spec)) }}</span>
              </div>
            </div>

            <div v-if="spec.dataKey" class="card-badge-live">
              <span>live</span>
            </div>
            <div v-else class="card-badge-calc">
              <span>calculated</span>
            </div>
          </div>
        </div>
      </section>

      <footer class="converter-note">
        <p>
          24K, 22K, 21K, and 18K prices are sourced directly from the
          <a href="https://www.bom.mu/industrial-gold" target="_blank" rel="noopener noreferrer" class="link-gold">Bank of Mauritius</a>.
          14K, 10K, and 9K prices are calculated using standard purity ratios relative to 24K.
        </p>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 72px);
  padding: 64px 24px 80px;
}

.page-inner {
  max-width: 860px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 48px;
}

.header-meta {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold-accent);
  margin-bottom: 20px;
}

html.dark .header-meta {
  color: var(--gold-light);
}

.page-title {
  font-family: var(--font-display);
  font-size: 72px;
  line-height: 0.9;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.title-light {
  font-weight: 300;
  font-style: italic;
  color: var(--text-secondary);
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.base-price-row {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--gold-color);
  border-radius: 0 6px 6px 0;
  flex-wrap: wrap;
}

.base-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--text-muted);
}

.base-value {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--gold-color);
}

html.dark .base-value {
  color: var(--gold-light);
}

.base-unit {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-muted);
  font-family: var(--font);
  margin-left: 2px;
}

.base-date {
  font-size: 12px;
  color: var(--text-muted);
}

/* Input section */
.input-section {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 28px 24px;
  margin-bottom: 32px;
}

.weight-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.weight-input-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.weight-input {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 600;
  color: var(--text);
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--border);
  outline: none;
  width: 200px;
  padding: 4px 0;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}

.weight-input::-webkit-outer-spin-button,
.weight-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.weight-input:focus {
  border-bottom-color: var(--gold-color);
}

.unit-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.unit-toggle button {
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  border-right: 1px solid var(--border);
}

.unit-toggle button:last-child {
  border-right: none;
}

.unit-toggle button:hover {
  color: var(--text);
  background: var(--row-hover);
}

.unit-toggle button.active {
  background: var(--gold-color);
  color: #000;
  font-weight: 600;
}

html.dark .unit-toggle button.active {
  background: var(--gold-accent);
  color: #fff;
}

.weight-equiv {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

/* Results */
.no-data {
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-size: 14px;
}

.loading-state {
  padding: 48px 0;
}

.loading-bar {
  height: 2px;
  width: 100%;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.loading-bar::after {
  content: '';
  position: absolute;
  left: -40%;
  top: 0;
  width: 40%;
  height: 100%;
  background: var(--gold-color);
  border-radius: 2px;
  animation: loading-slide 1.2s ease-in-out infinite;
}

@keyframes loading-slide {
  0% { left: -40%; }
  100% { left: 100%; }
}

.carat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.carat-card {
  background: var(--bg);
  padding: 20px;
  position: relative;
  transition: background 0.15s;
}

.carat-card.hovered {
  background: var(--row-hover);
}

.carat-card.is-24k {
  border-top: 2px solid var(--gold-color);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.karat-badge {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  min-width: 48px;
}

.purity-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.purity-bar-track {
  height: 4px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.purity-bar-fill {
  height: 100%;
  background: var(--gold-color);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.k-24 .purity-bar-fill { background: var(--gold-color); }
.k-22 .purity-bar-fill { background: #C8A838; }
.k-21 .purity-bar-fill { background: #C0A030; }
.k-18 .purity-bar-fill { background: #A88A28; }
.k-14 .purity-bar-fill { background: #907820; }
.k-10 .purity-bar-fill { background: #786418; }
.k-9  .purity-bar-fill { background: #685810; }

.purity-pct {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.card-prices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 12px;
  border-left: 2px solid var(--border);
}

.price-line.total {
  border-left-color: var(--gold-color);
}

.price-desc {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.price-val {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.price-val.total-val {
  font-size: 22px;
  color: var(--gold-color);
}

html.dark .price-val.total-val {
  color: var(--gold-light);
}

.card-badge-live,
.card-badge-calc {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-badge-live {
  color: var(--up-color);
  background: color-mix(in srgb, var(--up-color) 10%, transparent);
}

.card-badge-calc {
  color: var(--text-muted);
  background: var(--row-hover);
}

/* Note */
.converter-note {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

.link-gold {
  color: var(--gold-color);
  font-weight: 500;
  transition: color 0.2s;
}

.link-gold:hover {
  color: var(--gold-accent);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .page {
    padding: 40px 16px 60px;
  }

  .page-title {
    font-size: 52px;
  }

  .carat-grid {
    grid-template-columns: 1fr 1fr;
  }

  .weight-input {
    font-size: 32px;
    width: 160px;
  }

  .input-section {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .carat-grid {
    grid-template-columns: 1fr;
  }

  .weight-input-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
