// Theme placeholder script: demonstrates calling the middleware endpoints.
// In production, theme code should call your middleware endpoint via fetch
// and handle CORS / authentication appropriately.

async function previewCart(items){
  const resp = await fetch('http://localhost:4000/api/checkout/preview', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ items })
  });
  return resp.json();
}

async function requestOrder(items, customer){
  const resp = await fetch('http://localhost:4000/api/checkout/request', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ items, customer })
  });
  return resp.json();
}
