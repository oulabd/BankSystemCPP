// Carb Calculator frontend-only
const FOOD_DB_PATH = '/assets/data/carb-foods.json';
const STORAGE_KEY = 'carb_items_v1';


let FOOD_DB = {};
let items = [];

// Unit labels for i18n
const UNIT_LABELS = {
  'g': 'غرام',
  'pcs': 'قطعة',
  'tablespoon': 'ملعقة طعام'
};

function getUnitLabel(unit) {
  return UNIT_LABELS[unit] || unit;
}

// Internal labels dictionary (not using i18n file)
const CARB_LABELS = {
  'noFood': 'الرجاء اختيار طعام',
  'customRequired': 'أدخل كمية الكربوهيدرات للوحدة المختارة',
  'unknown': 'طعام غير معروف',
  'unitUnavailable': 'الوحدة المحددة غير متوفرة لهذا الطعام'
};

function getLabel(key) {
  return CARB_LABELS[key] || key;
}

// Only responsible for backend call, no fallback
async function searchFoodViaAPI(foodName) {
  try {
    let token = localStorage.getItem('authToken') || 
                localStorage.getItem('auth_token') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('authToken');
    if (!token) {
      console.warn('[CarbCalc] No auth token found in storage');
      return null;
    }
    const backendUrl = window.API_BASE || 'http://localhost:3001';
    const apiUrl = `${backendUrl}/api/patient/food/search?q=${encodeURIComponent(foodName)}`;
    console.log('[CarbCalc] Calling API:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('[CarbCalc] API response status:', response.status);
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: response.statusText };
      }
      console.warn('[CarbCalc] API error:', response.status, errorData);
      return null;
    }
    const data = await response.json();
    console.log('[CarbCalc] API response data:', data);
    if (data.success && data.food && typeof data.food.carbs_100g === 'number') {
      return data.food.carbs_100g;
    }
    return null;
  } catch (error) {
    console.warn('[CarbCalc] FatSecret API search failed:', error.message);
    console.error('[CarbCalc] Full error:', error);
    return null;
  }
}

// Get carbs per 100g: Local DB first, then API if not found
async function getCarbsPer100g(query) {
  if (!query) return null;
  const key = query.trim().toLowerCase();
  // 1. Local DB FIRST
  if (FOOD_DB[key]) {
    console.log('[CarbCalc] Using local DB result:', FOOD_DB[key].g);
    return FOOD_DB[key].g;
  }
  // 2. API only if not found locally
  return await searchFoodViaAPI(key);
}

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
      "banana": { "g":23, "pcs":27, "tablespoon":0 },
      "ekmek": { "g":48, "pcs":0, "tablespoon":0 },
      "bread": { "g":48, "pcs":0, "tablespoon":0 },
      "chicken": { "g":0, "pcs":0, "tablespoon":0 },
      "egg": { "g":1.1, "pcs":0, "tablespoon":0 }
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
    const qty = document.createElement('div'); qty.className = 'qty'; qty.textContent = `${it.qty} ${getUnitLabel(it.unit)}`;
    meta.appendChild(name); meta.appendChild(qty);

    const carbsDiv = document.createElement('div'); carbsDiv.className = 'carbs'; carbsDiv.textContent = `${formatCarbs(it.carbs)} غ`;

    const actions = document.createElement('div'); actions.className = 'actions';
    const del = document.createElement('button'); del.className = 'btn btn-outline'; del.textContent = '🗑';
    del.addEventListener('click', ()=>{ items.splice(idx,1); saveItems(); renderList(); });
    actions.appendChild(del);

    div.appendChild(meta); div.appendChild(carbsDiv); div.appendChild(actions);
    el.appendChild(div);
    total += Number(it.carbs) || 0;
  });
  document.getElementById('total-value').textContent = `${formatCarbs(total)} غ`;
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

  addBtn.addEventListener('click', async ()=>{
    const food = (foodInput.value || '').trim().toLowerCase();
    const unit = unitSel.value;
    const qty = Number(qtyInput.value) || 0;
    if(!food){ showAlert(getLabel('noFood')); return; }

    let carbs = null;
    const key = food.toLowerCase();
    if(manualChk && manualChk.checked){
      const v = Number(customInput.value);
      if(!v || v <= 0){ showAlert(getLabel('customRequired')); return; }
      // interpret based on unit: if g -> v is carbs per 100g, else per unit
      if(unit === 'g') carbs = (v * (qty/100));
      else carbs = v * qty;
      // Save custom as a temporary custom food in local DB
      FOOD_DB[key] = FOOD_DB[key] || {};
      FOOD_DB[key][unit] = v;
      populateDatalist();
    } else {
      // Try to get carbs from API first, then fallback to local DB
      const carbsPer100g = await getCarbsPer100g(food);
      
      if (carbsPer100g) {
        // API result: calculate from carbs per 100g (always uses grams)
        carbs = (carbsPer100g * (qty / 100));
      } else if (FOOD_DB[key]) {
        // Local DB result
        const rec = FOOD_DB[key];
        const unitVal = rec[unit];
        if(!unitVal || Number(unitVal) === 0){ showAlert(getLabel('unitUnavailable')); return; }
        carbs = calcCarbs(key, unit, qty);
      } else {
        // Food not found in API or local DB
        showAlert(getLabel('unknown'));
        // Show manual entry block and check the box
        if (manualChk && customBlock) {
          manualChk.checked = true;
          customBlock.style.display = '';
          customInput.focus();
        }
        return;
      }
    }

    const item = { food: food, unit, qty, carbs };
    items.push(item); saveItems(); renderList();
    // Clear input for next entry
    foodInput.value = '';
    qtyInput.value = '1';
  });

  // quick tests: allow Enter on food input to add
  document.getElementById('food-search').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn.click(); } });
}


function updateUnitSelect() {
  const unitSel = document.getElementById('unit-select');
  if (!unitSel) return;
  // Save current value
  const current = unitSel.value;
  unitSel.innerHTML = '';
  ['g', 'pcs', 'tablespoon'].forEach(unit => {
    const opt = document.createElement('option');
    opt.value = unit;
    opt.textContent = getUnitLabel(unit);
    unitSel.appendChild(opt);
  });
  // Restore previous selection if possible
  if (current && unitSel.querySelector(`[value="${current}"]`)) {
    unitSel.value = current;
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadFoodDB(); loadSaved(); renderList(); wire(); updateUnitSelect();
});

// Listen for language changes and update unit select
document.addEventListener('languageChanged', () => {
  updateUnitSelect();
});

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
    if(!tbody) return;
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
      const gramTd = document.createElement('td'); gramTd.textContent = food.defaultGram + ' غ';
      const carbsTd = document.createElement('td'); carbsTd.textContent = food.carbsPerPortion + ' غ';
      const portionsTd = document.createElement('td');
      const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.step = '0.1'; input.value = '1'; input.style.width = '80px';
      portionsTd.appendChild(input);

      const actionsTd = document.createElement('td');
      const btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.setAttribute('data-i18n', 'carb.add'); btn.textContent = 'إضافة';
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
      const gramsTd = document.createElement('td'); gramsTd.textContent = it.grams + ' غ';
      const carbsTd = document.createElement('td'); carbsTd.textContent = it.carbs + ' غ';
      const actionsTd = document.createElement('td');
      const del = document.createElement('button'); del.className = 'btn btn-outline'; del.setAttribute('data-i18n', 'actions.remove'); del.textContent = 'حذف';
      del.addEventListener('click', ()=> removeFromMeal(it.id));
      actionsTd.appendChild(del);

      tr.appendChild(nameTd); tr.appendChild(mealTd); tr.appendChild(portionsTd); tr.appendChild(gramsTd); tr.appendChild(carbsTd); tr.appendChild(actionsTd);
      tbody.appendChild(tr);
      total += Number(it.carbs) || 0;
    });
    qs('meal-total').textContent = total + ' غ';

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
      qs('sum-'+k).textContent = s + ' غ';
    });
    const dailyTotal = sum.breakfast + sum.lunch + sum.dinner + sum.snack;
    qs('sum-daily').textContent = dailyTotal + ' غ';
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
    // If the planner table isn't on the page (lightweight carb page), skip this module
    if(!qs('food-tbody')) return;
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

  // Listen for language changes and re-render
  document.addEventListener('languageChanged', (e) => {
    renderMeal();
  });

  // NOTE: Backend integration point example:
  // - POST /api/patient/carb-meals to save meal server-side
  // - GET /api/patient/carb-meals?date=YYYY-MM-DD to fetch saved meals
})();

function renderGlobalFoodSearchResults(query) {
  const resultsContainer = document.getElementById('global-search-results');
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '';
  const q = (query || '').trim().toLowerCase();
  Object.keys(FOOD_DB).forEach(foodKey => {
    if (foodKey.includes(q)) {
      const div = document.createElement('div');
      div.textContent = foodKey + ' (لكل 100غ: ' + FOOD_DB[foodKey].g + 'غ كربوهيدرات)';
      resultsContainer.appendChild(div);
    }
  });
}
