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
</script>

<template>
  <main class="luxury-page">
    <div class="hero-container" v-if="currentPrice">
      <div class="hero-content">
        <div class="meta-badge">
          <span>Updated {{ timeAgo(currentPrice.date) }}</span>
        </div>
        
        <h1 class="massive-title">
          <span class="text-light">Carat</span><br/>
          Converter
        </h1>

        <p class="page-description">
          Calculate the industrial market value of gold across different purities based on the latest Bank of Mauritius valuations.
        </p>

        <div class="conversion-base">
          <div class="input-group">
            <div class="input-header">
              <span class="label">Enter Weight</span>
              <div class="unit-selector">
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
            <div class="input-wrapper">
              <input
                v-model.number="weight"
                type="number"
                min="0"
                step="0.01"
                class="massive-input"
                placeholder="0"
              />
              <span class="unit-label">{{ selectedUnit }}</span>
            </div>
            <p v-if="selectedUnit !== 'g' && (weight ?? 0) > 0" class="equivalence">
              Approximately {{ weightInGrams.toFixed(4) }} grams
            </p>
          </div>
        </div>
      </div>

      <div class="results-visual">
        <div class="results-list">
          <div class="section-header">
            <h3 class="section-heading">Market Valuations</h3>
            <p class="section-sub">Calculated for {{ weight || 0 }} {{ selectedUnit }}</p>
          </div>
          <div 
            v-for="spec in CARATS" 
            :key="spec.label" 
            class="result-item"
            :class="{ 'is-base': spec.karat === 24 }"
          >
            <div class="result-info">
              <div class="karat-row">
                <span class="result-karat">{{ spec.label }}</span>
                <span v-if="spec.dataKey" class="live-tag">Official</span>
              </div>
              <span class="result-purity">{{ purityPercent(spec) }} purity ratio</span>
            </div>
            <div class="result-pricing">
              <div class="total-price">Rs {{ formatPriceShort(totalPrice(spec)) }}</div>
              <div class="unit-price">Rs {{ formatPriceShort(pricePerGram(spec)) }} / gram</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="coreLoading" class="loading-wrap">
      <div class="loading-text">Synchronizing market data...</div>
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
  padding: 80px 24px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 100px;
  align-items: center;
  z-index: 1;
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
  margin-bottom: 32px;
  letter-spacing: -0.02em;
}

.text-light {
  font-weight: 300;
  font-style: italic;
  color: var(--text-secondary);
}

.page-description {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 480px;
  line-height: 1.6;
  margin-bottom: 64px;
}

/* Input Styles */
.input-group {
  max-width: 500px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.input-header .label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.unit-selector {
  display: flex;
  gap: 20px;
}

.unit-selector button {
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

.unit-selector button::after {
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

.unit-selector button:hover {
  color: var(--text);
}

.unit-selector button.active {
  color: var(--gold-color);
  font-weight: 600;
}

.unit-selector button.active::after {
  width: 100%;
}

.input-wrapper {
  display: inline-flex;
  align-items: baseline;
  gap: 16px;
  border-bottom: 2px solid var(--border);
  padding-bottom: 12px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.input-wrapper:focus-within {
  border-color: var(--gold-color);
  padding-bottom: 16px;
}

.massive-input {
  font-family: var(--font-display);
  font-size: 80px;
  font-weight: 500;
  color: var(--text);
  background: transparent;
  border: none;
  outline: none;
  width: 240px;
  padding: 0;
  line-height: 1;
}

.unit-label {
  font-family: var(--font-display);
  font-size: 32px;
  font-style: italic;
  font-weight: 300;
  color: var(--text-muted);
}

.equivalence {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-muted);
  font-style: italic;
}

/* Results Styles */
.results-list {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
}

.section-heading {
  font-family: var(--font);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.section-sub {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 0;
  border-bottom: 1px solid var(--row-border);
  position: relative;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: var(--row-hover);
  padding-left: 24px;
  padding-right: 24px;
  margin-left: -24px;
  margin-right: -24px;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.is-base {
  border-left: 4px solid var(--gold-color);
  padding-left: 32px;
  background: rgba(212, 175, 55, 0.03);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.karat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-karat {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}

.live-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-accent);
}

html.dark .live-tag {
  background: rgba(229, 193, 88, 0.1);
  color: var(--gold-light);
}

.result-purity {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-pricing {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.total-price {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  color: var(--gold-color);
  line-height: 1;
}

html.dark .total-price {
  color: var(--gold-light);
}

.unit-price {
  font-size: 14px;
  color: var(--text-muted);
}

.loading-wrap {
  width: 100%;
  text-align: center;
  padding: 100px 0;
}

.loading-text {
  font-family: var(--font-display);
  font-size: 24px;
  font-style: italic;
  color: var(--text-muted);
}

@media (max-width: 1200px) {
  .hero-container {
    gap: 60px;
  }
  .massive-title {
    font-size: 80px;
  }
}

@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    padding-top: 60px;
    padding-bottom: 60px;
  }
  .massive-title {
    font-size: 72px;
  }
  .results-visual {
    margin-top: 40px;
  }
  .source-indicator {
    display: none;
  }
}

@media (max-width: 768px) {
  .massive-title {
    font-size: 64px;
  }
  .massive-input {
    font-size: 60px;
    width: 160px;
  }
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 24px 0;
  }
  .result-pricing {
    text-align: left;
  }
  .result-karat, .total-price {
    font-size: 28px;
  }
}
</style>
