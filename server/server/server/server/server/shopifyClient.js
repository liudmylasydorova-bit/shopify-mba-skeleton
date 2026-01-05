const axios = require('axios');

async function createDraftOrder(shopDomain, token, payload){
  const url = `https://${shopDomain}/admin/api/2024-10/draft_orders.json`;
  const resp = await axios.post(url, payload, { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } });
  const data = resp.data && resp.data.draft_order ? resp.data.draft_order : resp.data;
  return { id: data.id, admin_url: data.admin_graphql_api_id || null, raw: data };
}

module.exports = { createDraftOrder };
