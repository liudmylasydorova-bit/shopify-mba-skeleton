# OneClick Outfit — Shopify theme + Middleware MVP (mock mode)

This repository contains a hybrid MVP skeleton for OneClick Outfit: a Shopify theme scaffold (Liquid) and a Node.js Express middleware prototype that runs in mock mode by default and can be switched to live mode to create Draft Orders in Shopify test stores.

Branch: feature/shopify-theme-mvp

Contents
- /theme: Shopify theme scaffold (layout, templates, assets)
- /server: Node/Express middleware (mock/live)
- /prototype: static HTML/CSS/JS prototype for quick local demo
- .env.example: environment variables and mode toggle

Quick start (mock mode)
1. Clone the repo and checkout the branch:
   git fetch origin feature/shopify-theme-mvp && git checkout feature/shopify-theme-mvp

2. Start middleware (mock mode):
   cd server
   npm install
   cp .env.example .env
   # ensure MODE=mock in .env
   npm run dev

3. Open the static prototype for a quick demo:
   Open /prototype/index.html in your browser

Switching to live Shopify test stores
- Add SHOP_BRANDS JSON or per-brand env vars as shown in .env.example.
- Set MODE=live and provide brand shop domains and admin tokens.
- Restart the middleware.

Notes
- No secrets are committed. Put real tokens in your environment or a secure secret manager.
- The middleware will create Draft Orders in Shopify when in live mode using the provided tokens.
