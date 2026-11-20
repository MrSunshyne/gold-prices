# Mauritius Gold Prices

A web interface for browsing gold price data in Mauritius, sourced from the [Bank of Mauritius](https://www.bom.mu/industrial-gold).

Data is consumed from [mauritius-dataset-gold](https://github.com/MrSunshyne/mauritius-dataset-gold).

## Features

- Industrial gold prices by karat (24K, 22K, 21K, 18K), for Grains or Bar
- Dodo Gold Coin prices by denomination
- Interactive SVG price charts
- Sortable price history table with CSV download
- Comparison with the international gold price converted to rupees (BOM's premium)
- Warning when prices haven't updated for more than two business days
- Light/dark theme
- Static site deployed to GitHub Pages, with today's price prerendered into the HTML. The deploy workflow also checks hourly on weekdays and rebuilds when the dataset has a newer day

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
