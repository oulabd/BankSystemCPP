// i18n loader and language switcher (uses embedded `i18n.js`)
document.addEventListener('DOMContentLoaded', () => {
	const dropdownToggle = document.querySelector('.lang-switcher > a');
	const langDropdown = document.querySelector('.lang-dropdown');
	const langLinks = document.querySelectorAll('.lang-dropdown a');

	// Dynamically load the embedded i18n.js if it's not already present
	function ensureI18nLoaded() {
		return new Promise((resolve, reject) => {
			if (typeof applyTranslations === 'function') return resolve();
			const existing = document.querySelector('script[src="/assets/js/i18n.js"]') || document.querySelector('script[src="../assets/js/i18n.js"]') || document.querySelector('script[src="assets/js/i18n.js"]');
			if (existing) {
				if (existing.getAttribute('data-loaded') === '1') return resolve();
				existing.addEventListener('load', () => { existing.setAttribute('data-loaded', '1'); resolve(); });
				existing.addEventListener('error', () => reject(new Error('i18n.js failed to load')));
				return;
			}

			const s = document.createElement('script');
			s.src = '/assets/js/i18n.js';
			s.defer = true;
			s.onload = () => { s.setAttribute('data-loaded', '1'); resolve(); };
			s.onerror = () => reject(new Error('i18n.js failed to load'));
			document.head.appendChild(s);
		});
	}

	async function initI18n() {
		const lang = localStorage.getItem('lang') || 'tr';
		try {
			await ensureI18nLoaded();
			localStorage.setItem('lang', lang);
			document.documentElement.lang = lang;
			if (lang === 'ar') document.body.setAttribute('dir', 'rtl');
			else document.body.setAttribute('dir', 'ltr');
			if (typeof applyTranslations === 'function') applyTranslations();
		} catch (err) {
			console.error('Could not initialize embedded i18n', err);
		}
	}

	initI18n();

	// Wire language dropdown only if present
	if (dropdownToggle && langDropdown) {
		dropdownToggle.addEventListener('click', (e) => {
			e.preventDefault();
			langDropdown.classList.toggle('show');
		});

		if (langLinks && langLinks.length) {
			langLinks.forEach(btn => {
				btn.addEventListener('click', async (e) => {
					e.preventDefault();
					const lang = btn.dataset.lang;
					if (!lang) return;
					localStorage.setItem('lang', lang);
					document.documentElement.lang = lang;
					if (lang === 'ar') document.body.setAttribute('dir', 'rtl');
					else document.body.setAttribute('dir', 'ltr');
					try {
						await ensureI18nLoaded();
						if (typeof applyTranslations === 'function') applyTranslations();
					} catch (err) {
						console.error('Failed to apply translations after language change', err);
					}
					langDropdown.classList.remove('show');
				});
			});
		}

		// close on outside click
		window.addEventListener('click', (e) => {
			if (!e.target.closest('.lang-switcher')) {
				langDropdown.classList.remove('show');
			}
		});
	}

	// Also wire any header language buttons (.lang-item) present on pages
	const langItems = document.querySelectorAll('.lang-item');
	if (langItems && langItems.length) {
		langItems.forEach(btn => {
			btn.addEventListener('click', async (e) => {
				e.preventDefault();
				const lang = btn.getAttribute('data-lang') || btn.dataset.lang;
				if (!lang) return;
				localStorage.setItem('lang', lang);
				document.documentElement.lang = lang;
				if (lang === 'ar') document.body.setAttribute('dir', 'rtl');
				else document.body.setAttribute('dir', 'ltr');
				try {
					await ensureI18nLoaded();
					if (typeof applyTranslations === 'function') applyTranslations();
				} catch (err) {
					console.error('Failed to apply translations after language change', err);
				}
			});
		});
	}

	// Global delegated navigation handler for sidebar/cards across pages
	// Ensures clicks on elements with `data-nav` or `data-target` navigate correctly
	document.addEventListener('click', (e) => {
		const targetCard = e.target.closest('[data-target]');
		if (targetCard) {
			const t = targetCard.getAttribute('data-target');
			if (!t) return;
			e.preventDefault();
			if (t === 'history') return window.location.href = './history.html';
			if (t === 'appointments') return window.location.href = './appointments.html';
			if (t === 'prescriptions') return window.location.href = './prescriptions.html';
			if (t === 'carb') return window.location.href = './carb.html';
			if (t === 'labs') return window.location.href = './labs.html';
			if (t === 'maps') return window.location.href = './maps.html';
			if (t === 'charts') return window.location.href = './history.html';
			if (t === 'analyses') return window.location.href = './history.html';
		}

		const nav = e.target.closest('[data-nav]');
		if (nav) {
			const name = nav.getAttribute('data-nav');
			if (!name) return;
			e.preventDefault();
			if (name === 'history') return window.location.href = './history.html';
			if (name === 'appointments') return window.location.href = './appointments.html';
			if (name === 'prescriptions') return window.location.href = './prescriptions.html';
			if (name === 'carb') return window.location.href = './carb.html';
			if (name === 'labs') return window.location.href = './labs.html';
			if (name === 'maps') return window.location.href = './maps.html';
			if (name === 'charts') return window.location.href = './history.html';
			if (name === 'analyses') return window.location.href = './history.html';
		}
	}, { capture: true });
});

