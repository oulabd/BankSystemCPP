/* maps.js - Leaflet + local JSON data implementation
   - Uses OpenStreetMap tiles and local JSON files (hospitals.json, pharmacies.json)
   - No external paid API required
   - Features: Use my location, search by city, list results, markers, call buttons, emergency 112
*/

(function(){
  'use strict';

  // DOM
  const mapEl = document.getElementById('map');
  const btnUseLocation = document.getElementById('btn-use-location');
  const btnFindHospitals = document.getElementById('btn-find-hospitals');
  const btnFindPharmacies = document.getElementById('btn-find-pharmacies');
  const citySelect = document.getElementById('city-select');
  const locationsUl = document.getElementById('locations-ul');
  const mapLoading = document.getElementById('map-loading');
  const call112 = document.getElementById('call112');

  if(!mapEl){ console.warn('Map element not found'); return; }

  // Data files (local)
  const HOSPITALS_URL = '../assets/data/hospitals.json';
  const PHARMACIES_URL = '../assets/data/pharmacies.json';

  // Local storage keys
  const STORAGE_CITY = 'diyabetliyim:lastCity';
  const STORAGE_LOC = 'diyabetliyim:lastLocation';

  // Map defaults
  const TURKEY_CENTER = [39.0, 35.0];
  const DEFAULT_ZOOM = 6;

  // State
  let hospitals = [];
  let pharmacies = [];
  let provincesList = [];
  let lastResults = [];
  let lastSearch = { type: null, city: '' };
  let userPos = null;
  let userMarker = null;
  let placeMarkers = [];

  // set default language to Turkish unless app sets another
  window.currentLang = window.currentLang || 'tr';

  function showLoading(v){ if(!mapLoading) return; mapLoading.hidden = !v; }
  function setStatus(msg){ /* left intentionally simple; UI shows messages via loc-status if needed */ }

  // Create map
  const map = L.map(mapEl, { preferCanvas:true }).setView(TURKEY_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);

  // icons
  const hospitalIcon = L.divIcon({ className:'med-icon hospital', html:'🏥', iconSize:[28,28], iconAnchor:[14,14] });
  const pharmacyIcon = L.divIcon({ className:'med-icon pharmacy', html:'💊', iconSize:[28,28], iconAnchor:[14,14] });
  const userIcon = L.divIcon({ className:'user-icon', html:'<div style="width:14px;height:14px;border-radius:50%;background:#0fb1a2;border:3px solid #fff"></div>', iconSize:[20,20], iconAnchor:[10,10] });

  // helpers
  function haversineKm(lat1, lon1, lat2, lon2){ function toRad(x){return x*Math.PI/180} const R=6371; const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1); const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2); const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); return +(R*c).toFixed(2); }
  function clearMarkers(){ placeMarkers.forEach(p=>map.removeLayer(p.marker)); placeMarkers = []; if(locationsUl) locationsUl.innerHTML = ''; }
  function saveLastCity(city){ try{ localStorage.setItem(STORAGE_CITY, city); }catch(e){} }
  function loadLastCity(){ try{ return localStorage.getItem(STORAGE_CITY) || ''; }catch(e){ return ''; } }
  function saveLastLocation(lat,lng){ try{ localStorage.setItem(STORAGE_LOC, JSON.stringify({lat,lng,ts:Date.now()})); }catch(e){} }
  function loadLastLocation(){ try{ const v = localStorage.getItem(STORAGE_LOC); return v?JSON.parse(v):null }catch(e){ return null } }

  function renderList(items){
    if(!locationsUl) return;
    locationsUl.innerHTML = '';
    items.forEach((it, idx)=>{
      const li = document.createElement('li'); li.dataset.idx = idx; li.className = 'loc-item';
      const left = document.createElement('div'); left.style.flex='1';
      const name = document.createElement('div'); name.className = 'loc-name';
      // multilingual name if present
      if(it.name && typeof it.name === 'object'){
        const lang = (window.currentLang || 'tr'); name.textContent = it.name[lang] || it.name.tr || it.name.en || '';
      } else { name.textContent = it.name || it.address || ''; }
      const meta = document.createElement('div'); meta.className = 'loc-distance';
      if(userPos && it.lat && it.lng){ meta.textContent = haversineKm(userPos.lat,userPos.lng,it.lat,it.lng) + ' ' + (window.t?window.t('maps.distanceKm'):'km'); }
      else meta.textContent = '';
      left.appendChild(name); left.appendChild(meta);
      const right = document.createElement('div');
      const call = document.createElement('a'); call.className = 'btn btn-primary'; call.textContent = (window.t?window.t('maps.call'):'Call'); call.href = `tel:${it.phone || ''}`; call.style.marginLeft='8px';
      right.appendChild(call);
      li.appendChild(left); li.appendChild(right);
      li.addEventListener('click', ()=>{ const m = placeMarkers[idx]; if(m){ map.setView(m.marker.getLatLng(), 15); m.marker.openPopup(); highlightListItem(idx); } });
      locationsUl.appendChild(li);
    });
    if(typeof applyTranslations === 'function') applyTranslations();
  }

  function highlightListItem(idx){ const prev = locationsUl.querySelector('.active'); if(prev) prev.classList.remove('active'); const li = locationsUl.querySelector(`[data-idx="${idx}"]`); if(li) li.classList.add('active'); }

  function addMarkerForPlace(place, idx, type){
    const icon = (type==='pharmacy') ? pharmacyIcon : hospitalIcon;
    const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
    const nameText = (typeof place.name === 'object') ? (place.name[window.currentLang || 'tr'] || place.name.tr) : place.name;
    const rating = place.rating ? `${place.rating} ⭐` : '-';
    const phone = place.phone ? `<a href="tel:${place.phone}" class="map-popup-btn">${(window.t?window.t('maps.call'):'Call')}</a>` : '';
    const dist = (userPos) ? `${haversineKm(userPos.lat,userPos.lng,place.lat,place.lng)} ${window.t?window.t('maps.distanceKm'):'km'}` : '';
    const content = `<div style="min-width:180px"><strong>${nameText}</strong><div style="font-size:13px;color:#666">${place.city || ''}</div><div style="margin-top:6px">${(window.t?window.t('maps.rating'):'Rating')}: ${rating}</div><div style="margin-top:8px">${phone} <a class="map-popup-btn" target="_blank" href="https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}">${(window.t?window.t('maps.view'):'View')}</a></div><div style="margin-top:6px;color:#666;font-size:13px">${dist}</div></div>`;
    marker.bindPopup(content);
    placeMarkers.push({ marker, data: place });
  }

  // Load local JSON data and populate city dropdown
  async function loadData(){
    showLoading(true);
    try{
      const [hRes, pRes, provRes] = await Promise.all([fetch(HOSPITALS_URL), fetch(PHARMACIES_URL), fetch('../assets/data/turkey_provinces.json')]);
      hospitals = (await hRes.json()) || [];
      pharmacies = (await pRes.json()) || [];
      provincesList = (await provRes.json()) || [];
      // populate select with provinces using current language
      if(citySelect){
        citySelect.innerHTML = '';
        const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent = (window.t?window.t('maps.selectCity'):'Select city'); citySelect.appendChild(emptyOpt);
        provincesList.forEach(p=>{
          const label = p[window.currentLang] || p.tr;
          const o = document.createElement('option'); o.value = p.tr; o.textContent = label; citySelect.appendChild(o);
        });
        const last = loadLastCity(); if(last) citySelect.value = last;
      }
      showLoading(false);
      if(typeof applyTranslations === 'function') applyTranslations();
    }catch(e){ showLoading(false); console.error('Failed loading local data', e); }
  }

  // Search and display
  function searchHospitalsByCity(city){
    clearMarkers();
    const list = hospitals.filter(h => !city || h.city === city);
    lastResults = list.slice(); lastSearch = { type: 'hospital', city: city };
    if(!list || list.length === 0){
      // no hospitals in selected province — show friendly message
      if(locationsUl){ locationsUl.innerHTML = `<li class="no-results">${(window.t?window.t('maps.noResults'):'No hospitals found in selected province')}</li>`; }
      return;
    }
    // If user position available, sort by distance
    if(userPos){ list.forEach(l=> l._dist = haversineKm(userPos.lat,userPos.lng,l.lat,l.lng)); list.sort((a,b)=> (a._dist||0)-(b._dist||0)); }
    list.forEach((p, i)=> addMarkerForPlace(p, i, 'hospital'));
    renderList(list);
    if(placeMarkers.length) map.fitBounds(L.featureGroup(placeMarkers.map(p=>p.marker)).getBounds().pad(0.25));
  }

  function searchPharmaciesByCity(city){
    clearMarkers();
    const list = pharmacies.filter(h => !city || h.city === city);
    lastResults = list.slice(); lastSearch = { type: 'pharmacy', city: city };
    if(!list || list.length === 0){
      if(locationsUl){ locationsUl.innerHTML = `<li class="no-results">${(window.t?window.t('maps.noResults'):'No duty pharmacies found in selected province')}</li>`; }
      return;
    }
    if(userPos){ list.forEach(l=> l._dist = haversineKm(userPos.lat,userPos.lng,l.lat,l.lng)); list.sort((a,b)=> (a._dist||0)-(b._dist||0)); }
    list.forEach((p, i)=> addMarkerForPlace(p, i, 'pharmacy'));
    renderList(list);
    if(placeMarkers.length) map.fitBounds(L.featureGroup(placeMarkers.map(p=>p.marker)).getBounds().pad(0.25));
  }

  // Language switching: re-render labels and dropdowns
  function setLanguage(lang){
    window.currentLang = lang || 'tr';
    if(typeof applyTranslations === 'function') applyTranslations();
    // repopulate city select with new language labels
    if(citySelect && provincesList && provincesList.length){
      const sel = citySelect.value;
      citySelect.innerHTML = '';
      const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent = (window.t?window.t('maps.selectCity'):'Select city'); citySelect.appendChild(emptyOpt);
      provincesList.forEach(p=>{ const label = p[window.currentLang] || p.tr; const o = document.createElement('option'); o.value = p.tr; o.textContent = label; citySelect.appendChild(o); });
      if(sel) citySelect.value = sel;
    }
    // re-render last results in new language
    if(lastResults && lastResults.length){ clearMarkers(); lastResults.forEach((it,i)=> addMarkerForPlace(it,i,lastSearch.type)); renderList(lastResults); }
  }

  // Wire header language buttons if present
  const langButtons = document.querySelectorAll('.lang-item');
  if(langButtons && langButtons.length){ langButtons.forEach(b=> b.addEventListener('click', ()=> setLanguage(b.dataset.lang))); }

  // Use my location
  btnUseLocation && btnUseLocation.addEventListener('click', ()=>{
    if(!navigator.geolocation){ alert((window.t?window.t('maps.noLocation'):'Geolocation not supported')); return; }
    showLoading(true);
    navigator.geolocation.getCurrentPosition(pos=>{
      showLoading(false);
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      saveLastLocation(userPos.lat, userPos.lng);
      if(!userMarker) userMarker = L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map);
      else userMarker.setLatLng([userPos.lat, userPos.lng]);
      map.setView([userPos.lat, userPos.lng], 13);
      // automatically search hospitals in selected city (if any) else show nearby hospitals across data
      const city = citySelect && citySelect.value ? citySelect.value : '';
      if(city) searchHospitalsByCity(city);
      else {
        // compute distances across all hospitals and show nearest 8
        const list = hospitals.map(h=> Object.assign({}, h, { _dist: haversineKm(userPos.lat,userPos.lng,h.lat,h.lng) }));
        list.sort((a,b)=> (a._dist||0)-(b._dist||0));
        clearMarkers(); list.slice(0,8).forEach((p,i)=> addMarkerForPlace(p,i,'hospital')); renderList(list.slice(0,8)); if(placeMarkers.length) map.fitBounds(L.featureGroup(placeMarkers.map(p=>p.marker)).getBounds().pad(0.25));
      }
    }, err=>{ showLoading(false); if(err.code===1) alert((window.t?window.t('maps.locationDenied'):'Location permission denied')); else alert((window.t?window.t('maps.locationError'):'Unable to retrieve location')); }, { enableHighAccuracy:true, timeout:10000 });
  });

  // Buttons
  btnFindHospitals && btnFindHospitals.addEventListener('click', ()=>{ const city = citySelect && citySelect.value ? citySelect.value : ''; saveLastCity(city); searchHospitalsByCity(city); });
  btnFindPharmacies && btnFindPharmacies.addEventListener('click', ()=>{ const city = citySelect && citySelect.value ? citySelect.value : ''; saveLastCity(city); searchPharmaciesByCity(city); });
  call112 && call112.addEventListener('click', ()=>{ window.location.href = 'tel:112'; });

  // restore last city
  const lastCity = loadLastCity(); if(lastCity && citySelect) citySelect.value = lastCity;
  // restore last location
  const lastLoc = loadLastLocation(); if(lastLoc){ userPos = { lat:lastLoc.lat, lng:lastLoc.lng }; if(!userMarker) userMarker = L.marker([userPos.lat,userPos.lng], { icon: userIcon }).addTo(map); map.setView([userPos.lat,userPos.lng], 10); }

  // initialize
  loadData();
  if(typeof applyTranslations === 'function') applyTranslations();

})();
