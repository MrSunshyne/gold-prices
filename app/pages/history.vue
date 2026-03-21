<script setup lang="ts">
const {
  sortedPrices,
  sortField,
  sortDirection,
  toggleSort,
  formatDate,
  formatPrice,
  prices,
  timeAgo,
} = useGoldPrices()

useHead({
  title: 'Mauritius Gold Price Index — Price History',
})

function sortIndicator(field: string): string {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? ' \u25B2' : ' \u25BC'
}
</script>

<template>
  <main class="page">
    <section class="hero">
      <h2>Price History</h2>
      <p class="hero-sub">Complete record of industrial gold prices from the Bank of Mauritius.</p>
    </section>

    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Total Records</div>
        <div class="stat-value">{{ prices.length.toLocaleString() }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Date Range</div>
        <div class="stat-value">{{ formatDate(prices[prices.length - 1]?.date) }} — {{ formatDate(prices[0]?.date) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Last Updated</div>
        <div class="stat-value">{{ timeAgo(prices[0]?.date) }}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('date')">
              Date{{ sortIndicator('date') }}
            </th>
            <th class="sortable" @click="toggleSort('24k')">
              24K{{ sortIndicator('24k') }}
            </th>
            <th class="sortable" @click="toggleSort('22k')">
              22K{{ sortIndicator('22k') }}
            </th>
            <th class="sortable" @click="toggleSort('21k')">
              21K{{ sortIndicator('21k') }}
            </th>
            <th class="sortable" @click="toggleSort('18k')">
              18K{{ sortIndicator('18k') }}
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

.stats-row {
  display: flex;
  gap: 0;
  border: 2px solid var(--border);
  margin-bottom: 32px;
}

.stat-box {
  flex: 1;
  padding: 16px 20px;
  border-right: 2px solid var(--border);
}

.stat-box:last-child {
  border-right: none;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
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

th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}

th.sortable:hover {
  background: var(--text);
  color: var(--bg);
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

.td-24k {
  font-weight: 700;
  color: var(--gold-color);
}

@media (max-width: 768px) {
  .hero h2 {
    font-size: 32px;
  }

  .stats-row {
    flex-direction: column;
  }

  .stat-box {
    border-right: none;
    border-bottom: 2px solid var(--border);
  }

  .stat-box:last-child {
    border-bottom: none;
  }
}
</style>
