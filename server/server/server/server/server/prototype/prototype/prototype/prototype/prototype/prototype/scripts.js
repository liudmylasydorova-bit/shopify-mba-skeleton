/* scripts.js (prototype)
   Implements: Quiz, Results, Cart (uses localStorage).
*/

const Quiz = (function(){
  const questions = [
    { key: 'gender', title: 'Gender', choices: ['Male','Female','Neither'] },
    { key: 'style', title: 'Style Vibe', choices: ['Casual','Streetwear','Minimalist','Classic','Elegant','Business','Bohemian','Sporty'] },
    { key: 'occasion', title: 'Occasion', choices: ['Business','Party','Dinner','Weekend','Office','Travel','Date Night','Wedding','Sports'] },
    { key: 'season', title: 'Season', choices: ['Spring','Summer','Autumn','Winter','All Year'] },
    { key: 'price', title: 'Price Range (€)', choices: ['0–100','100–300','300–500','500+'] },
    { key: 'colors', title: 'Color Preferences', choices: ['Neutrals only','Neutral + Soft','Bold colors','Earth tones','Monochrome','No preference'] }
  ];

  let container, index = 0, answers = {};

  function renderQuestion(){
    const area = container;
    area.innerHTML = '';
    const q = questions[index];
    const card = document.createElement('div'); card.className = 'q-card';
    const title = document.createElement('div'); title.className='q-title'; title.textContent = q.title;
    card.appendChild(title);

    const choices = document.createElement('div'); choices.className='choices';
    q.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.textContent = choice;
      btn.addEventListener('click', function(){
        answers[q.key] = choice;
        btn.classList.add('selected');
        setTimeout(()=>{ next() }, 220);
      });
      choices.appendChild(btn);
    });

    card.appendChild(choices);
    area.appendChild(card);

    const pct = Math.round((index / questions.length) * 100);
    const fill = document.getElementById('progressFill');
    if(fill) fill.style.width = `${pct}%`;
  }

  function next(){
    index++;
    if(index >= questions.length){
      if(typeof finishCb === 'function') finishCb(answers);
    } else {
      renderQuestion();
    }
  }

  let finishCb = null;
  function init(el, options){
    container = el;
    finishCb = options && options.onComplete;
    index = 0;
    answers = {};
    renderQuestion();
  }

  function reset(){
    index = 0;
    answers = {};
    localStorage.removeItem('oco_quiz_answers');
  }

  return { init, reset, _questions:questions };
})();

const Results = (function(){
  function generateFromAnswers(ans){
    const seed = (ans && ans.style) ? ans.style : 'default';
    const outfits = [];
    for(let i=0;i<6;i++){
      const season = (ans && ans.season) ? ans.season : 'All Year';
      outfits.push({
        id: `outfit-${i}`,
        title: `${seed} Outfit ${i+1}`,
        season,
        occasion: (ans && ans.occasion) || 'Everyday',
        products: [
          { id:`p-${i}-1`, name:'Top', price_eur: 49 + i*10, brand: 'BrandA', brandKey:'brand_a', image:`https://picsum.photos/seed/${seed}-top-${i}/600/400` },
          { id:`p-${i}-2`, name:'Bottom', price_eur: 69 + i*8, brand: 'BrandB', brandKey:'brand_b', image:`https://picsum.photos/seed/${seed}-bot-${i}/600/400` },
          { id:`p-${i}-3`, name:'Shoes', price_eur: 99 + i*12, brand: 'BrandC', brandKey:'brand_c', image:`https://picsum.photos/seed/${seed}-s-${i}/600/400` }
        ]
      });
    }
    return outfits;
  }

  function render(container){
    const stored = localStorage.getItem('oco_quiz_answers');
    let answers = stored ? JSON.parse(stored) : null;
    if(!answers){
      container.innerHTML = '<p class="small">No quiz answers found. <a href="quiz.html">Take the quiz</a> to see personalized outfits.</p>';
      return;
    }
    const outfits = generateFromAnswers(answers);
    container.innerHTML = '';
    outfits.forEach(outfit => {
      const card = document.createElement('div'); card.className = 'outfit-card';
      const img = document.createElement('img'); img.src = outfit.products[0].image;
      card.appendChild(img);
      const body = document.createElement('div'); body.className='outfit-body';
      const title = document.createElement('div'); title.style.fontWeight='700'; title.textContent = outfit.title;
      body.appendChild(title);
      outfit.products.forEach(p=>{
        const row = document.createElement('div'); row.className='product-row';
        row.innerHTML = `<div>${p.brand} — ${p.name}</div><div>€${p.price_eur}</div>`;
        body.appendChild(row);
      });
      const actions = document.createElement('div'); actions.style.marginTop='8px';
      const btn = document.createElement('button'); btn.className='btn primary';
      btn.textContent = 'Add to Cart';
      btn.addEventListener('click', function(){
        Cart.addOutfitToCart(outfit);
        btn.textContent = 'Added ✓';
        setTimeout(()=>btn.textContent='Add to Cart',900);
      });
      actions.appendChild(btn);
      body.appendChild(actions);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  return { render, generateFromAnswers };
})();

const Cart = (function(){
  const KEY = 'oco_cart';
  function get(){ return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  function set(items){ localStorage.setItem(KEY, JSON.stringify(items)); }
  function add(product){
    const items = get();
    items.push(product);
    set(items);
  }
  function addOutfitToCart(outfit){
    const items = get();
    outfit.products.forEach(p => {
      items.push({ ...p, outfitId: outfit.id, brandKey: p.brandKey, brandName: p.brand });
    });
    set(items);
  }
  function remove(index){
    const items = get();
    items.splice(index,1);
    set(items);
  }
  function render(container){
    const items = get();
    container.innerHTML = '';
    if(items.length === 0){
      container.innerHTML = '<p class="small">Your cart is empty. Add outfits from the My Style page.</p>';
      return;
    }
    let total = 0;
    items.forEach((it, idx)=>{
      total += (it.price_eur || 0);
      const el = document.createElement('div'); el.className = 'cart-item';
      el.innerHTML = `
        <img src="${it.image || 'https://picsum.photos/seed/cart-'+idx+'/200/200'}" alt="${it.name}">
        <div style="flex:1">
          <div style="font-weight:700">${it.name} <span style="font-weight:400;color:var(--muted)"> — ${it.brand}</span></div>
          <div class="small">€${it.price_eur}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button class="btn ghost remove-btn" data-idx="${idx}">Remove</button>
        </div>
      `;
      container.appendChild(el);
    });
    const totalEl = document.createElement('div'); totalEl.style.textAlign='right'; totalEl.style.marginTop='10px';
    totalEl.innerHTML = `<div style="font-weight:700">Total: €${total}</div>`;
    container.appendChild(totalEl);

    container.querySelectorAll('.remove-btn').forEach(btn=>{
      btn.addEventListener('click', function(e){
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'),10);
        remove(idx);
        render(container);
      });
    });
  }

  return { get, add, remove, render, addOutfitToCart };
})();
