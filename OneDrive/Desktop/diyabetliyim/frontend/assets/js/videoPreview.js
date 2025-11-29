const DEFAULT_VIDEO_PATH = 'assets/media/invideo_ai_1080_This_Glucose_Meter_UI_Reveal_Is_Pure_Cin_2025_11_13_V2.mp4';

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  });

  const container = document.createElement('div');
  container.className = 'video-container';
  Object.assign(container.style, { width: '90%', maxWidth: '960px', position: 'relative' });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '\u2715';
  Object.assign(closeBtn.style, {
    position: 'absolute', right: '-12px', top: '-12px', background: '#fff', border: '0', borderRadius: '20px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px'
  });
  closeBtn.addEventListener('click', () => {
    stopAndRemove(overlay);
  });

  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.style.width = '100%';
  video.style.borderRadius = '10px';

  const source = document.createElement('source');
  source.type = 'video/mp4';
  video.appendChild(source);

  container.appendChild(video);
  container.appendChild(closeBtn);
  overlay.appendChild(container);

  // close when clicking outside container
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) stopAndRemove(overlay);
  });

  return { overlay, video };
}

function stopAndRemove(overlay) {
  try {
    const v = overlay.querySelector('video');
    if (v) {
      v.pause();
      v.removeAttribute('src');
      while (v.firstChild) v.removeChild(v.firstChild);
    }
  } catch (err) {
    console.warn('Error stopping video', err);
  }
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('show-me-btn');
  // Attach to show-me button (uses default video)
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const { overlay, video } = createOverlay();
      // set source
      const src = overlay.querySelector('source');
      src.src = DEFAULT_VIDEO_PATH;
      video.load();
      document.body.appendChild(overlay);
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') playPromise.catch(()=>{});
    });
  }

  // Attach to any element that has data-video-src attribute (e.g., header link)
  const headerLinks = document.querySelectorAll('[data-video-src]');
  headerLinks.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-video-src');
      if (!path) return;
      const { overlay, video } = createOverlay();
      const src = overlay.querySelector('source');
      src.src = path;
      video.load();
      document.body.appendChild(overlay);
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') playPromise.catch(()=>{});
    });
  });
});
