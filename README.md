# Mauritius Gold Prices

A web interface for browsing gold price data in Mauritius, sourced from the [Bank of Mauritius](https://www.bom.mu/industrial-gold).

Data is consumed from [mauritius-dataset-gold](https://github.com/MrSunshyne/mauritius-dataset-gold).

## Features

- Industrial gold prices by karat (24K, 22K, 21K, 18K)
- Dodo Gold Coin prices by denomination
- Interactive SVG price charts
- Sortable price history table
- Light/dark theme
- Static site deployed to GitHub Pages

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm generate
```

## Stack

- Nuxt 4
- Vue 3
- TypeScript
- Vanilla CSS
