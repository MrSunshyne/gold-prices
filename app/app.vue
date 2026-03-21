<script setup lang="ts">
const { DATA_SOURCE, fetchCoreData } = useGoldPrices()

const route = useRoute()

const dark = ref(false)

onMounted(() => {
  dark.value = localStorage.getItem('theme') === 'dark'
    || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyTheme()
  fetchCoreData()
})

function toggleDark() {
  dark.value = !dark.value
  localStorage.setItem('theme', dark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', dark.value)
}
</script>

<template>
  <div class="app">
    <div class="top-accent"></div>
    <header class="header">
      <div class="header-inner">
        <div class="header-left">
          <NuxtLink to="/" class="header-title">
            <svg class="gold-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#goldGradient)" stroke-width="2"/>
              <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" fill="url(#goldGradient)"/>
              <defs>
                <linearGradient id="goldGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#E5C158"/>
                  <stop offset="1" stop-color="#B5952F"/>
                </linearGradient>
              </defs>
            </svg>
            <h1>Mauritius Gold</h1>
          </NuxtLink>
          <nav class="header-nav">
            <NuxtLink to="/" :class="{ active: route.path === '/' }">Overview</NuxtLink>
            <NuxtLink to="/gold" :class="{ active: route.path === '/gold' }">Gold</NuxtLink>
            <NuxtLink to="/coins" :class="{ active: route.path === '/coins' }">Coins</NuxtLink>
            <NuxtLink to="/history" :class="{ active: route.path === '/history' }" class="hide-mobile">History</NuxtLink>
          </nav>
        </div>
        <div class="header-actions">
          <a
            href="https://github.com/MrSunshyne/gold-prices"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn"
            title="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button class="action-btn theme-toggle" :title="dark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleDark">
            <svg v-if="dark" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M14 9.2A6.5 6.5 0 0 1 6.8 2 6 6 0 1 0 14 9.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <NuxtPage />

    <footer class="page-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <svg class="gold-icon-small" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#goldGradientSmall)" stroke-width="2"/>
            <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" fill="url(#goldGradientSmall)"/>
            <defs>
              <linearGradient id="goldGradientSmall" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#E5C158"/>
                <stop offset="1" stop-color="#B5952F"/>
              </linearGradient>
            </defs>
          </svg>
          <span>Mauritius Gold Prices</span>
        </div>
        <div class="footer-links">
          <p>
            Data sourced from the
            <a :href="DATA_SOURCE.url" target="_blank" rel="noopener noreferrer" class="link-gold">{{ DATA_SOURCE.name }}</a>.
          </p>
          <p>
            Dataset: <a href="https://github.com/MrSunshyne/mauritius-dataset-gold" target="_blank" rel="noopener noreferrer" class="link-gold">mauritius-dataset-gold</a>
          </p>
          <p>
            Built by <a href="https://github.com/MrSunshyne" target="_blank" rel="noopener noreferrer" class="link-gold">Sandeep Ramgolam</a>
          </p>
        </div>
        <div class="footer-actions">
          <a
            href="https://github.com/MrSunshyne/gold-prices"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn"
            title="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button class="action-btn theme-toggle" :title="dark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleDark">
            <svg v-if="dark" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M14 9.2A6.5 6.5 0 0 1 6.8 2 6 6 0 1 0 14 9.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

:root {
  --bg: #FAFAFA;
  --surface: transparent; /* No more distinct surface for cards */
  --border: rgba(0, 0, 0, 0.08);
  --text: #111827;
  --text-secondary: #4B5563;
  --text-muted: #9CA3AF;
  --table-header: rgba(0, 0, 0, 0.02);
  --row-border: rgba(0, 0, 0, 0.06);
  --row-hover: rgba(0, 0, 0, 0.02);
  --gold-color: #D4AF37;
  --gold-light: #F3E5AB;
  --gold-accent: #B5952F;
  --up-color: #059669;
  --down-color: #DC2626;
  --neutral-color: #6B7280;
  
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Cormorant Garamond', Georgia, serif;
}

html.dark {
  --bg: #0A0A0A;
  --surface: transparent;
  --border: rgba(255, 255, 255, 0.1);
  --text: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-muted: #6B7280;
  --table-header: rgba(255, 255, 255, 0.03);
  --row-border: rgba(255, 255, 255, 0.06);
  --row-hover: rgba(255, 255, 255, 0.03);
  --gold-color: #E5C158;
  --gold-light: #FDE68A;
  --gold-accent: #D4AF37;
  --up-color: #10B981;
  --down-color: #EF4444;
  
  color-scheme: dark;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text);
}

a {
  color: inherit;
  text-decoration: none;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-accent {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, var(--gold-color), var(--gold-light), var(--gold-accent));
}

.header {
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 48px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.gold-icon {
  width: 28px;
  height: 28px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.02em;
}

.header-nav {
  display: flex;
  gap: 32px;
}

.header-nav a {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  padding: 8px 0;
  position: relative;
}

.header-nav a::after {
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

.header-nav a:hover {
  color: var(--text);
}

.header-nav a.active {
  color: var(--text);
}

.header-nav a.active::after {
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  cursor: pointer;
}

.action-btn:hover {
  background: var(--row-hover);
  color: var(--text);
}

.page-footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--bg);
  padding: 48px 0;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.gold-icon-small {
  width: 20px;
  height: 20px;
}

.footer-links {
  text-align: right;
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.footer-actions {
  display: none;
  gap: 12px;
}

@media (max-width: 768px) {
  .header-inner {
    height: auto;
    padding: 12px 16px;
    flex-wrap: wrap;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .header-title h1 {
    font-size: 16px;
  }

  .gold-icon {
    width: 20px;
    height: 20px;
  }

  .header-title {
    gap: 8px;
  }

  .header-nav {
    gap: 16px;
  }

  .header-nav a {
    font-size: 13px;
  }

  .header-actions {
    display: none;
  }

  .hide-mobile {
    display: none;
  }

  .footer-actions {
    display: flex;
  }

  .footer-inner {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }
  
  .footer-links {
    text-align: center;
    align-items: center;
  }
}
</style>
