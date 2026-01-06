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
