// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// parse JSON bodies early so POST handlers can use req.body
app.use(express.json());

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Public/demo product endpoints (placed BEFORE authentication middleware)
app.get("/api/products/count", async (_req, res) => {
  // If there is no authenticated session, return a demo count so the UI works for demos.
  if (!res.locals || !res.locals.shopify || !res.locals.shopify.session) {
    // Demo fallback — safe for presentations only
    return res.status(200).send({ count: 12, demo: true });
  }

  // If a session exists, use the real GraphQL client to return the real count.
  try {
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    const countData = await client.request(`
      query shopifyProductCount {
        productsCount {
          count
        }
      }
    `);

    return res.status(200).send({ count: countData.data.productsCount.count });
  } catch (e) {
    console.error("Error fetching product count:", e);
    return res.status(500).send({ error: e.message });
  }
});

app.post("/api/products", async (_req, res) => {
  // If no session, return a demo success for presentation (do not modify store)
  if (!res.locals || !res.locals.shopify || !res.locals.shopify.session) {
    return res.status(200).send({ success: true, demo: true });
  }

  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

// Authentication/validation middleware (keep this after the public/demo routes)
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
