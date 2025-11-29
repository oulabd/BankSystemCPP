// Carb Calculator frontend-only
const FOOD_DB_PATH = '/assets/data/carb-foods.json';
const STORAGE_KEY = 'carb_items_v1';

let FOOD_DB = {};
let items = [];

function loadFoodDB(){
  // Try fetch, fallback to embedded list if fetch fails
  return fetch(FOOD_DB_PATH).then(r=>{
    if(!r.ok) throw new Error('no data');
    return r.json();
  }).catch(()=>{
    // local fallback
    return Promise.resolve({
      "apple": { "g":14, "pcs":19, "tablespoon":0 },
      "rice": { "g":28, "pcs":0, "tablespoon":6 },
      "banana": { "g":23, "pcs":27, "tablespoon":0 }
    });
  }).then(j=>{ FOOD_DB = j; populateDatalist(); });
}

function populateDatalist(){
  const dl = document.getElementById('food-list');
  if(!dl) return;
  dl.innerHTML = '';
  Object.keys(FOOD_DB).forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; dl.appendChild(opt);
  });
}

function formatCarbs(val){
  return Math.round((val + Number.EPSILON) * 10) / 10; // 1 decimal
}

function calcCarbs(foodKey, unit, qty){
  const rec = FOOD_DB[foodKey];
  if(!rec) return null;
  const per = rec[unit];
  if(!per || Number(per) === 0) return 0; // unavailable treated as 0 -> show alert elsewhere
  // units: if unit is g, per is carbs per 100g
  if(unit === 'g'){
    // per is carbs per 100g
    return (per * (qty/100));
  }
  // pcs or tablespoon are per unit values
  return per * qty;
}

function loadSaved(){
  try{ const s = localStorage.getItem(STORAGE_KEY); if(s) items = JSON.parse(s); }catch(e){}
}

function saveItems(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function renderList(){
  const el = document.getElementById('added-list'); el.innerHTML = '';
  let total = 0;
  items.forEach((it, idx)=>{
    const div = document.createElement('div'); div.className = 'added-item';
    const meta = document.createElement('div'); meta.className = 'meta';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = it.food;
    const qty = document.createElement('div'); qty.className = 'qty'; qty.textContent = `${it.qty} ${it.unit}`;
    meta.appendChild(name); meta.appendChild(qty);

    const carbsDiv = document.createElement('div'); carbsDiv.className = 'carbs'; carbsDiv.textContent = `${formatCarbs(it.carbs)} g`;

    const actions = document.createElement('div'); actions.className = 'actions';
    const del = document.createElement('button'); del.className = 'btn btn-outline'; del.textContent = '🗑';
    del.addEventListener('click', ()=>{ items.splice(idx,1); saveItems(); renderList(); });
    actions.appendChild(del);

    div.appendChild(meta); div.appendChild(carbsDiv); div.appendChild(actions);
    el.appendChild(div);
    total += Number(it.carbs) || 0;
  });
  document.getElementById('total-value').textContent = `${formatCarbs(total)} g`;
}

function showAlert(msg){ alert(msg); }

function wire(){
  const addBtn = document.getElementById('add-food');
  const foodInput = document.getElementById('food-search');
  const unitSel = document.getElementById('unit-select');
  const qtyInput = document.getElementById('qty-input');
  const manualChk = document.getElementById('manual-entry');
  const customBlock = document.getElementById('custom-block');
  const customInput = document.getElementById('custom-carb');

  // show/hide custom input when manual is toggled
  if(manualChk){
    manualChk.addEventListener('change', ()=>{
      if(manualChk.checked) customBlock.style.display = '';
      else customBlock.style.display = 'none';
    });
  }

  addBtn.addEventListener('click', ()=>{
    const food = (foodInput.value || '').trim().toLowerCase();
    const unit = unitSel.value;
    const qty = Number(qtyInput.value) || 0;
    if(!food){ showAlert(t('carb.err.noFood') || 'Select food'); return; }

    let carbs = null;
    const key = food.toLowerCase();
    if(manualChk && manualChk.checked){
      const v = Number(customInput.value);
      if(!v || v <= 0){ showAlert(t('carb.err.customRequired') || 'Enter carbs for selected unit'); return; }
      // interpret based on unit: if g -> v is carbs per 100g, else per unit
      if(unit === 'g') carbs = (v * (qty/100));
      else carbs = v * qty;
      // Optionally save custom as a temporary custom food in local DB
      // store under lowercased food key
      FOOD_DB[key] = FOOD_DB[key] || {};
      FOOD_DB[key][unit] = v;
      populateDatalist();
    } else {
      if(!FOOD_DB[key]){ showAlert(t('carb.err.unknown') || 'Unknown food'); return; }
      const rec = FOOD_DB[key];
      const unitVal = rec[unit];
      if(!unitVal || Number(unitVal) === 0){ showAlert(t('carb.err.unitUnavailable') || 'Selected unit not available for this food'); return; }
      carbs = calcCarbs(key, unit, qty);
    }

    const item = { food: food, unit, qty, carbs };
    items.push(item); saveItems(); renderList();
    // clear qty or keep
    qtyInput.value = '1';
  });

  // quick tests: allow Enter on food input to add
  document.getElementById('food-search').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn.click(); } });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadFoodDB(); loadSaved(); renderList(); wire();
});
// carb.js - Carb Calculator (frontend only)
// - Auth guard (patient only)
// - FOOD_LIBRARY uses i18n keys only for names
// - Current meal stored in memory and saved to localStorage per date
// - No backend integration yet; placeholders marked where API calls could be added

const AUTH_TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';

(function(){
  // food library (use keys only, visible names via data-i18n)
  const FOOD_LIBRARY = [
    { id: 1, key: 'food.breadSlice', defaultGram: 30, carbsPerPortion: 15 },
    { id: 2, key: 'food.riceCooked', defaultGram: 100, carbsPerPortion: 28 },
    { id: 3, key: 'food.pastaCooked', defaultGram: 100, carbsPerPortion: 26 },
    { id: 4, key: 'food.appleMedium', defaultGram: 120, carbsPerPortion: 18 },
    { id: 5, key: 'food.bananaMedium', defaultGram: 100, carbsPerPortion: 23 },
    { id: 6, key: 'food.milkGlass', defaultGram: 200, carbsPerPortion: 10 },
    { id: 7, key: 'food.yogurtPlain', defaultGram: 150, carbsPerPortion: 7 },
    { id: 8, key: 'food.orangeMedium', defaultGram: 130, carbsPerPortion: 15 },
    { id: 9, key: 'food.chocolatePiece', defaultGram: 10, carbsPerPortion: 5 },
    { id: 10, key: 'food.friesSmall', defaultGram: 80, carbsPerPortion: 24 }
  ];

  function authGuard(){
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('auth_token');
    const role = localStorage.getItem(ROLE_KEY);
    if(!token || role !== 'patient'){
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }

  const qs = id => document.getElementById(id);

  // current meal items in memory
  let currentMealItems = []; // {id, foodKey, portions, grams, carbs, mealType}

  function todayKey(){
    const d = new Date();
    return 'carb_daily_' + d.toISOString().slice(0,10);
  }

  function loadDaily(){
    try{
      const raw = localStorage.getItem(todayKey());
      return raw ? JSON.parse(raw) : { breakfast: [], lunch: [], dinner: [], snack: [] };
    }catch(e){ return { breakfast: [], lunch: [], dinner: [], snack: [] }; }
  }

  function saveDaily(data){
    localStorage.setItem(todayKey(), JSON.stringify(data));
  }

  function clearDaily(){
    localStorage.removeItem(todayKey());
  }

  function renderFoodLibrary(filter=''){
    const tbody = qs('food-tbody');
    tbody.innerHTML = '';
    const q = String(filter||'').trim().toLowerCase();
    FOOD_LIBRARY.forEach(food => {
      // for filtering, check the key and i18n text (if translated)
      const label = (typeof t === 'function') ? t(food.key) : food.key;
      if(q){
        if(!(label.toLowerCase().includes(q) || food.key.toLowerCase().includes(q))) return;
      }
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td'); nameTd.setAttribute('data-i18n', food.key);
      const gramTd = document.createElement('td'); gramTd.textContent = food.defaultGram + ' g';
      const carbsTd = document.createElement('td'); carbsTd.textContent = food.carbsPerPortion + ' g';
      const portionsTd = document.createElement('td');
      const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.step = '0.1'; input.value = '1'; input.style.width = '80px';
      portionsTd.appendChild(input);

      const actionsTd = document.createElement('td');
      const btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.setAttribute('data-i18n', 'carb.add'); btn.textContent = 'Add';
      btn.addEventListener('click', ()=>{
        const portions = Number(input.value) || 1;
        addToMeal(food, portions);
      });
      actionsTd.appendChild(btn);

      tr.appendChild(nameTd); tr.appendChild(gramTd); tr.appendChild(carbsTd); tr.appendChild(portionsTd); tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    if(typeof applyTranslations === 'function') applyTranslations();
  }

  function addToMeal(food, portions){
    const mealType = qs('carb-mealtype').value || 'breakfast';
    const grams = (Number(food.defaultGram) || 0) * portions;
    const carbs = (Number(food.carbsPerPortion) || 0) * portions;
    const item = { id: Date.now() + Math.random(), foodKey: food.key, portions, grams, carbs, mealType };
    currentMealItems.push(item);
    renderCurrentMeal();
  }

  function removeFromMeal(id){
    currentMealItems = currentMealItems.filter(i=>i.id !== id);
    renderCurrentMeal();
  }

  function renderCurrentMeal(){
    const tbody = qs('meal-tbody');
    tbody.innerHTML = '';
    let total = 0;
    currentMealItems.forEach(it => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td'); nameTd.setAttribute('data-i18n', it.foodKey);
      const mealTd = document.createElement('td'); mealTd.setAttribute('data-i18n', 'carb.mealType.'+it.mealType);
      const portionsTd = document.createElement('td'); portionsTd.textContent = it.portions;
      const gramsTd = document.createElement('td'); gramsTd.textContent = it.grams + ' g';
      const carbsTd = document.createElement('td'); carbsTd.textContent = it.carbs + ' g';
      const actionsTd = document.createElement('td');
      const del = document.createElement('button'); del.className = 'btn btn-outline'; del.setAttribute('data-i18n', 'actions.remove'); del.textContent = 'Remove';
      del.addEventListener('click', ()=> removeFromMeal(it.id));
      actionsTd.appendChild(del);

      tr.appendChild(nameTd); tr.appendChild(mealTd); tr.appendChild(portionsTd); tr.appendChild(gramsTd); tr.appendChild(carbsTd); tr.appendChild(actionsTd);
      tbody.appendChild(tr);
      total += Number(it.carbs) || 0;
    });
    qs('meal-total').textContent = total + ' g';

    // warnings
    const warnEl = qs('meal-warnings'); warnEl.innerHTML = '';
    if(total > 80){ const w = document.createElement('div'); w.className = 'carb-warning-high'; w.setAttribute('data-i18n','carb.mealHighWarning'); warnEl.appendChild(w); }
    else if(total < 10 && total > 0){ const w = document.createElement('div'); w.className = 'carb-warning-low'; w.setAttribute('data-i18n','carb.mealLowWarning'); warnEl.appendChild(w); }

    if(typeof applyTranslations === 'function') applyTranslations();
  }

  function saveMealToDaily(){
    if(currentMealItems.length === 0) return;
    const daily = loadDaily();
    currentMealItems.forEach(it => {
      if(!daily[it.mealType]) daily[it.mealType] = [];
      daily[it.mealType].push(it);
    });
    saveDaily(daily);
    currentMealItems = [];
    renderCurrentMeal();
    renderDailySummary();
  }

  function renderDailySummary(){
    const daily = loadDaily();
    const sum = { breakfast:0, lunch:0, dinner:0, snack:0 };
    Object.keys(sum).forEach(k => {
      const arr = daily[k] || [];
      const s = arr.reduce((acc,x)=> acc + (Number(x.carbs)||0), 0);
      sum[k] = s;
      qs('sum-'+k).textContent = s + ' g';
    });
    const dailyTotal = sum.breakfast + sum.lunch + sum.dinner + sum.snack;
    qs('sum-daily').textContent = dailyTotal + ' g';
    const dw = qs('daily-warning'); dw.innerHTML = '';
    if(dailyTotal > 250){ const el = document.createElement('div'); el.className = 'carb-warning-daily'; el.setAttribute('data-i18n','carb.dailyHighWarning'); dw.appendChild(el); }
    if(typeof applyTranslations === 'function') applyTranslations();
  }

  function clearMeal(){ currentMealItems = []; renderCurrentMeal(); }
  function resetAll(){ clearDaily(); renderDailySummary(); clearMeal(); }

  function setupHandlers(){
    qs('carb-search').addEventListener('input', (e)=> renderFoodLibrary(e.target.value));
    qs('carb-clear').addEventListener('click', (e)=>{ e.preventDefault(); clearMeal(); });
    qs('carb-reset').addEventListener('click', (e)=>{ e.preventDefault(); if(confirm(t('confirm.delete'))){ resetAll(); } });
    qs('carb-save').addEventListener('click', (e)=>{ e.preventDefault(); saveMealToDaily(); });
    qs('carb-print').addEventListener('click', ()=> window.print());
  }

  async function init(){
    if(!authGuard()) return;
    renderFoodLibrary();
    renderCurrentMeal();
    renderDailySummary();
    setupHandlers();

    // Apply translations (food names, buttons etc.)
    if(typeof applyTranslations === 'function') applyTranslations();
  }

  // Expose for debugging
  window.__CARB__ = { addToMeal, clearMeal, resetAll };

  document.addEventListener('DOMContentLoaded', init);

  // NOTE: Backend integration point example:
  // - POST /api/patient/carb-meals to save meal server-side
  // - GET /api/patient/carb-meals?date=YYYY-MM-DD to fetch saved meals
})();
