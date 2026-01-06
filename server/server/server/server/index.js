const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const ShopifyClient = require('./shopifyClient');

require('dotenv').config();

const MODE = (process.env.MODE || 'mock');
const PORT = process.env.PORT || 4000;

let SHOP_BRANDS = [];
if(process.env.SHOP_BRANDS){
  try{ SHOP_BRANDS = JSON.parse(process.env.SHOP_BRANDS); }catch(e){ console.warn('Invalid SHOP_BRANDS JSON'); }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

const ORDERS = {};

app.get('/api/health', (req,res)=>res.json({ok:true,mode:MODE}));

// Preview endpoint: groups items per brand and returns simulated totals
app.post('/api/checkout/preview', (req,res)=>{
  const { items=[], customer={} } = req.body;
  const groups = {};
  items.forEach(it=>{
    const key = it.brandKey || 'unknown';
    groups[key] = groups[key] || { items: [], subtotal:0, brandKey:key, brandName: it.brandName || key };
    groups[key].items.push(it);
    groups[key].subtotal += (it.price_eur || 0) * (it.quantity||1);
  });
  let total = 0;
  Object.values(groups).forEach(g=> total += g.subtotal);
  res.json({ groups, total, currency: 'EUR' });
});

// Request endpoint: create per-brand Draft Orders (mock or live)
app.post('/api/checkout/request', async (req,res)=>{
  const { items=[], customer={} } = req.body;
  const unifiedId = 'uco_'+uuidv4();
  const groups = {};
  items.forEach(it=>{
    const key = it.brandKey || 'unknown';
    groups[key] = groups[key] || { items: [], brandKey:key, brandName: it.brandName || key };
    groups[key].items.push(it);
  });

  const results = {};
  for(const [key, group] of Object.entries(groups)){
    if(MODE === 'mock'){
      const draftId = 'mock_draft_'+Math.floor(Math.random()*90000+10000);
      results[key] = { draft_order_id: draftId, admin_url: `https://admin.mock/${draftId}`, status: 'created_mock' };
    } else {
      const brand = SHOP_BRANDS.find(b=>b.key === key);
      if(!brand){
        results[key] = { error: 'brand_not_configured' };
        continue;
      }
      try{
        const payload = {
          draft_order: {
            line_items: group.items.map(p=>({
              title: p.name,
              price: (p.price_eur||0).toFixed(2),
              quantity: p.quantity || 1,
              sku: p.sku || undefined
            })),
            note: `Requested via OneClick Outfit unifiedId:${unifiedId}`
          }
        };
        const resp = await ShopifyClient.createDraftOrder(brand.shop, brand.token, payload);
        results[key] = { draft_order_id: resp.id, admin_url: resp.admin_url, status: 'created_live', raw: resp.raw };
      }catch(err){
        results[key] = { error: err.message };
      }
    }
  }

  ORDERS[unifiedId] = { id: unifiedId, items, customer, results, createdAt: new Date().toISOString() };
  res.json(ORDERS[unifiedId]);
});

app.get('/api/orders/:id', (req,res)=>{
  const id = req.params.id;
  if(!ORDERS[id]) return res.status(404).json({error:'not_found'});
  res.json(ORDERS[id]);
});

app.listen(PORT, ()=>console.log(`OCO middleware listening on ${PORT} (mode=${MODE})`));
