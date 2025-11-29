document.addEventListener('DOMContentLoaded', function() {
    loadPendingDoctors();

    function loadPendingDoctors() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Not authenticated');
            window.location.href = '../login.html';
            return;
        }

        fetch('/api/admin/doctors/pending', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(doctors => {
            displayDoctors(doctors);
        })
        .catch(error => {
            console.error('Error loading pending doctors:', error);
            alert('Error loading doctors');
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
                    <button class="approve-btn" data-id="${doctor._id}" data-i18n="admin.approve">Onayla</button>
                    <button class="reject-btn" data-id="${doctor._id}" data-i18n="admin.reject">Reddet</button>
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
    }

    function approveDoctor(id) {
        const token = localStorage.getItem('token');
        fetch(`/api/admin/doctors/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                alert('Doctor approved successfully');
                loadPendingDoctors(); // Reload list
            } else {
                alert('Error approving doctor');
            }
        })
        .catch(error => {
            console.error('Error approving doctor:', error);
            alert('Error approving doctor');
        });
    }

    function rejectDoctor(id) {
        if (!confirm('Are you sure you want to reject this doctor?')) return;

        const token = localStorage.getItem('token');
        fetch(`/api/admin/doctors/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                alert('Doctor rejected and removed');
                loadPendingDoctors(); // Reload list
            } else {
                alert('Error rejecting doctor');
            }
        })
        .catch(error => {
            console.error('Error rejecting doctor:', error);
            alert('Error rejecting doctor');
        });
    }
});