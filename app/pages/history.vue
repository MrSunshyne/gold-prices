<script setup lang="ts">
const {
  sortedPrices,
  sortField,
  sortDirection,
  toggleSort,
  formatDate,
  formatPrice,
  pricesLoaded,
  fetchPrices,
  totalEntries,
  firstDate,
  lastDate,
  timeAgo,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Price History',
})

onMounted(() => {
  fetchPrices()
})

function sortIndicator(field: string): string {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? ' \u2191' : ' \u2193'
}
</script>

<template>
  <main class="page">
    <div class="hero-section">
      <div class="meta-info">
        <span>Updated {{ timeAgo(lastDate) }}</span>
        <span class="divider"></span>
        <span>Bank of Mauritius</span>
      </div>
      <h2 class="main-title">Complete Price History</h2>
    </div>

    <div class="data-split">
      <div class="history-stats">
        <h3 class="section-heading">Archive Overview</h3>
        <div class="stat-list">
          <div class="list-item">
            <span class="list-label">Total Records</span>
            <span class="list-value">{{ totalEntries.toLocaleString() }}</span>
          </div>
          <div class="list-item">
            <span class="list-label">First Entry</span>
            <span class="list-value">{{ formatDate(firstDate) }}</span>
          </div>
          <div class="list-item">
            <span class="list-label">Latest Entry</span>
            <span class="list-value">{{ formatDate(lastDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <section class="table-section">
      <div v-if="!pricesLoaded" class="loading">Loading price history...</div>
      <template v-else>
      <h3 class="section-heading">Detailed Valuations</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('date')">
                Date<span class="sort-icon">{{ sortIndicator('date') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('24k')">
                24K<span class="sort-icon">{{ sortIndicator('24k') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('22k')">
                22K<span class="sort-icon">{{ sortIndicator('22k') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('21k')">
                21K<span class="sort-icon">{{ sortIndicator('21k') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('18k')">
                18K<span class="sort-icon">{{ sortIndicator('18k') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in sortedPrices" :key="entry.date">
              <td class="td-date">{{ formatDate(entry.date) }}</td>
              <td class="td-price td-24k">{{ formatPrice(entry.karats['24k']) }}</td>
              <td class="td-price">{{ formatPrice(entry.karats['22k']) }}</td>
              <td class="td-price">{{ formatPrice(entry.karats['21k']) }}</td>
              <td class="td-price">{{ formatPrice(entry.karats['18k']) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
    </section>
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

.data-split {
  margin-bottom: 80px;
}

.stat-list {
  display: flex;
  flex-direction: column;
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

th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

th.sortable:hover {
  color: var(--text);
}

.sort-icon {
  margin-left: 4px;
  color: var(--gold-color);
  font-size: 14px;
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

.td-24k {
  color: var(--gold-color);
  font-weight: 600;
}

.loading {
  padding: 80px 0;
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
}
</style>
