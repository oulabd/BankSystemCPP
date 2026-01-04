const API_BASE = window.API_BASE || window.__API_BASE__ || ((location.port && location.port !== '3000') ? `http://${location.hostname}:3000` : '');

document.addEventListener('DOMContentLoaded', function() {
    loadPendingDoctors();

    function loadPendingDoctors() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            alert('فشل التحقق من الهوية');
            window.location.href = '../login.html';
            return;
        }

        fetch(`${API_BASE}/api/admin/doctors/pending`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(doctors => {
            displayDoctors(doctors);
        })
        .catch(error => {
            console.error('خطأ أثناء تحميل الأطباء المعلقين:', error);
            alert('حدث خطأ أثناء تحميل الأطباء');
        });
    }

    function displayDoctors(doctors) {
        const tbody = document.getElementById('doctors-list');
        const noPending = document.getElementById('no-pending');

        if (doctors.length === 0) {
            tbody.innerHTML = '';
            noPending.style.display = 'block';
            return;
        }

        noPending.style.display = 'none';
        tbody.innerHTML = doctors.map(doctor => `
            <tr>
                <td>${doctor.fullName}</td>
                <td>${doctor.email}</td>
                <td>${doctor.identityNumber}</td>
                <td>
                    <button class="approve-btn" data-id="${doctor._id}">الموافقة</button>
                    <button class="reject-btn" data-id="${doctor._id}">رفض</button>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                approveDoctor(this.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                rejectDoctor(this.getAttribute('data-id'));
            });
        });

        // i18n kaldırıldı, Türkçe sabit metinler kullanılıyor
    }

    function approveDoctor(id) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
        fetch(`${API_BASE}/api/admin/doctors/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                alert('تمت الموافقة على الطبيب بنجاح');
                loadPendingDoctors(); // Listeyi yeniden yükle
            } else {
                alert('حدث خطأ أثناء الموافقة على الطبيب');
            }
        })
        .catch(error => {
            console.error('حدث خطأ أثناء الموافقة على الطبيب:', error);
            alert('حدث خطأ أثناء الموافقة على الطبيب');
        });
    }

    function rejectDoctor(id) {
        if (!confirm('هل أنت متأكد من رفض هذا الطبيب؟')) return;

        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
        fetch(`${API_BASE}/api/admin/doctors/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                alert('تم رفض الطبيب وحذفه');
                loadPendingDoctors(); // Listeyi yeniden yükle
            } else {
                alert('حدث خطأ أثناء رفض الطبيب');
            }
        })
        .catch(error => {
            console.error('حدث خطأ أثناء رفض الطبيب:', error);
            alert('حدث خطأ أثناء رفض الطبيب');
        });
    }
});