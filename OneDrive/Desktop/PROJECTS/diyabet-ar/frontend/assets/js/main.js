
window.API_BASE = "/api";
console.log("✅ main.js جاهز للعمل");


document.addEventListener('DOMContentLoaded', () => {
	// منع الوصول للصفحات المحمية بعد تسجيل الخروج (إجبار تسجيل الدخول عند عدم التوثيق)
	const protectedPages = [
		'patient-dashboard.html', 'history.html', 'appointments.html', 'prescriptions.html', 'labs.html', 'carb.html', 'personal-settings.html', 'chat.html'
	];
	const isProtected = protectedPages.some(page => window.location.pathname.includes(page));
	const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
	const role = localStorage.getItem('userRole');
	if (isProtected && (!token || (role !== 'patient' && role !== 'doctor'))) {
		// مسح البيانات الحساسة وإعادة التوجيه لصفحة الدخول
		localStorage.removeItem('authToken');
		localStorage.removeItem('auth_token');
		localStorage.removeItem('userRole');
		window.location.replace('../login.html');
	}
	// منطق زر تسجيل الخروج العام
	const logoutBtn = document.getElementById('logoutBtn');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
			localStorage.removeItem('authToken');
			localStorage.removeItem('auth_token');
			localStorage.removeItem('userRole');
			window.location.href = '../login.html';
		});
	}
	// --- اكتشاف الخادم تلقائياً ---
	async function detectBackend() {
		// Respect preset API base (e.g., set in login.html)
		if (window.__API_BASE__) return;

		// If not on backend port, assume backend is on :5000
// Local-only: no port auto-detect needed

		// Same-origin fallback (when served by the backend)
		window.__API_BASE__ = '';
	}
	detectBackend();
	// --- نهاية اكتشاف الخادم ---

	// معالج تنقل مفوض عام لأزرار وأقسام التنقل عبر الصفحات
	// يضمن أن النقر على العناصر ذات data-nav أو data-target ينتقل بشكل صحيح
	document.addEventListener('click', (e) => {
		const targetCard = e.target.closest('[data-target]');
		if (targetCard) {
			const t = targetCard.getAttribute('data-target');
			if (!t) return;
			e.preventDefault();
			if (t === 'daily') return window.location.href = './patient-dashboard.html';
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
			if (name === 'daily') return window.location.href = './patient-dashboard.html';
			if (name === 'history') return window.location.href = './history.html';
			if (name === 'appointments') return window.location.href = './appointments.html';
			if (name === 'prescriptions') return window.location.href = './prescriptions.html';
			if (name === 'carb') return window.location.href = './carb.html';
			if (name === 'labs') return window.location.href = './labs.html';
			if (name === 'personal-settings') return window.location.href = './personal-settings.html';
			if (name === 'maps') return window.location.href = './maps.html';
			if (name === 'charts') return window.location.href = './history.html';
			if (name === 'analyses') return window.location.href = './history.html';
		}
	}, { capture: true });

	
});