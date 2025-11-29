const i18n = {
    tr: {
        // Genel
        'home': 'Anasayfa',
        'login': 'Giriş Yap',
        'print': 'Yazdır',
        'edit': 'Düzenle',
        'delete': 'Sil',
        'actions': 'İşlemler',
        'notes': 'Notlar',
        'notifications.empty': 'Bildirim yok',
        'footer.copy': '© 2025 DİYABETLİYİM',

        // Profil
        'profile.view': 'Profil',
        'profile.edit': 'Bilgileri Düzenle',
        'profile.password': 'Şifre Değiştir',
        'profile.logout': 'Çıkış',

        // Menü
        'menu.daily': 'Günlük Ölçümler',
        'card.history': 'Ölçüm Geçmişi & Yazdır',
        'card.appointments': 'Randevu',
        'card.prescriptions': 'Reçeteler',
        'card.labs': 'Laboratuvar',
        'card.carb': 'Karbonhidrat Hesaplayıcı',
        'card.maps': 'Haritalar',

        // Hasta Paneli
        'title.patientDashboard': 'Hasta Paneli - DİYABETLİYİM',
        'daily.title': 'Günlük Glikoz Ölçümleri',
        'daily.fasting': 'Açlık',
        'daily.beforeBreakfast': 'Kahvaltı Öncesi',
        'daily.afterBreakfast': 'Kahvaltı Sonrası',
        'daily.breakfastCarbs': 'Kahvaltı Karbonhidrat',
        'daily.breakfastInsulin': 'Kahvaltı İnsülin',
        'daily.snack1': 'Ara Öğün 1',
        'daily.beforeLunch': 'Öğle Öncesi',
        'daily.afterLunch': 'Öğle Sonrası',
        'daily.lunchCarbs': 'Öğle Yemeği Karbonhidrat',
        'daily.lunchInsulin': 'Öğle Yemeği İnsülin',
        'daily.snack2': 'Ara Öğün 2',
        'daily.beforeDinner': 'Akşam Öncesi',
        'daily.afterDinner': 'Akşam Sonrası',
        'daily.dinnerCarbs': 'Akşam Yemeği Karbonhidrat',
        'daily.dinnerInsulin': 'Akşam Yemeği İnsülin',
        'daily.snack3': 'Ara Öğün 3',
        'daily.lantus': 'Lantus',
        'daily.measurement_12am': 'Gece 12 Ölçümü',
        'daily.measurement_3am': 'Gece 3 Ölçümü',
        'daily.save': 'Kaydet',
        'warning.high': 'Yüksek kritik glikoz tespit edildi',
        'warning.low': 'Hipoglisemi riski tespit edildi',

        // Geçmiş Sayfası
        'history.title': 'Ölçüm Geçmişi',
        'filter.start': 'Başlangıç tarihi',
        'filter.end': 'Bitiş tarihi',
        'filter.apply': 'Uygula',
        'filter.clear': 'Temizle',
        'results.title': 'Sonuçlar',
        'results.count_suffix': 'kayıt bulundu',
        'day': 'Gün',
        'no_measurements': 'Ölçüm bulunamadı',
        'confirm.delete': 'Bu kaydı silmek istediğinizden emin misiniz?',

        // Randevu Sayfası
        'appointments.title': 'Randevularım',
        'appointments.subtitle': 'Yaklaşan randevularınızı yönetin ve yenilerini oluşturun.',
        'appointments.form.title': 'Yeni Randevu Oluştur',
        'appointments.form.doctorLabel': 'Doktor Seçin',
        'appointments.form.doctorPlaceholder': 'Bir doktor seçin...',
        'appointments.form.dateLabel': 'Tarih',
        'appointments.form.timeLabel': 'Saat',
        'appointments.form.typeLabel': 'Randevu Tipi',
        'appointments.form.type.clinic': 'Klinik',
        'appointments.form.type.online': 'Online',
        'appointments.form.type.emergency': 'Acil',
        'appointments.form.notesLabel': 'Notlar',
        'appointments.form.notesPlaceholder': 'Randevu ile ilgili ek notlar...',
        'appointments.form.submit': 'Randevu Oluştur',
        'appointments.msg.validationError': 'Lütfen tüm gerekli alanları doldurun.',
        'appointments.upcoming.title': 'Yaklaşan Randevular',
        'appointments.msg.noAppointments': 'Yaklaşan randevu bulunmamaktadır.',
        'appointments.table.header.date': 'Tarih',
        'appointments.table.header.time': 'Saat',
        'appointments.table.header.doctor': 'Doktor',
        'appointments.table.header.type': 'Tip',
        'appointments.table.header.status': 'Durum',
        'appointments.actions.cancel': 'İptal Et',
        'appointments.actions.details': 'Detaylar',

        // Reçete Sayfası
        'prescriptions.title': 'İnsülin & Sensör Reçeteleri',
        'prescriptions.subtitle': 'Aktif ve geçmiş reçetelerinizi görüntüleyin.',
        'prescriptions.active.title': 'Aktif Reçeteler',
        'prescriptions.warning.expiringSoon': 'Yakında sona eriyor!',
        'prescriptions.insulin.title': 'İnsülin Reçetesi',
        'prescriptions.sensor.title': 'Sensör Reçetesi',
        'prescriptions.label.type': 'Tip',
        'prescriptions.label.units': 'Ünite',
        'prescriptions.label.issued': 'Veriliş Tarihi',
        'prescriptions.label.expires': 'Bitiş Tarihi',
        'prescriptions.button.viewAll': 'Tümünü Görüntüle',
        'prescriptions.empty': 'Aktif reçete bulunmamaktadır.',
        'prescriptions.history.title': 'Reçete Geçmişi',
        'prescriptions.history.show': 'Geçmişi Göster',
        'prescriptions.history.hide': 'Geçmişi Gizle',
        'prescriptions.history.empty': 'Reçete geçmişi bulunmamaktadır.',
        'prescriptions.button.download': 'İndir',
        'prescriptions.button.print': 'Yazdır',
        'prescriptions.button.downloadAll': 'Tümünü İndir',
        'prescriptions.button.printAll': 'Tümünü Yazdır',
        'prescriptions.status.expired': 'Süresi Dolmuş',
        'prescriptions.status.replaced': 'Değiştirilmiş',
        // Prescriptions page (presc.*)
        'presc.pageTitle': 'Reçeteler',
        'presc.subtitle': 'Aktif ve geçmiş reçetelerinizi görüntüleyin.',
        'presc.insulinTitle': 'İnsülin Reçetesi',
        'presc.sensorTitle': 'Sensör (CGM) Reçetesi',
        'presc.typeLabel': 'Tip',
        'presc.doseLabel': 'Doz',
        'presc.issuedLabel': 'Veriliş',
        'presc.noData': '---',
        'presc.print': 'Yazdır',
        'presc.request': 'Yeni Reçete İste',
        'presc.sensorTypeLabel': 'Tip',
        'presc.insulinType': 'İnsülin Tipi',
        'presc.insulinDose': 'Doz',
        'presc.insulinDate': 'Veriliş Tarihi',
        'presc.sensorName': 'Sensör',
        'presc.sensorDate': 'Veriliş Tarihi'
        
        // New prescription system
        , 'prescriptions.new': 'Yeni Reçete'
        , 'prescriptions.download': 'PDF İndir'
        , 'prescriptions.verify': 'Doğrula'
        , 'prescriptions.items': 'İlaçlar / İnsülin'
        , 'prescriptions.dose': 'Doz'
        , 'prescriptions.frequency': 'Sıklık'
        , 'prescriptions.patient': 'Hasta'
        , 'prescriptions.item': 'Ürün'
        , 'prescriptions.addItem': 'Ürün Ekle'
        , 'prescriptions.list': 'Reçete Geçmişi'
        , 'prescriptions.noData': 'Reçete bulunamadı'
        , 'prescriptions.verifyTitle': 'Reçete Doğrulama'
        , 'prescriptions.type.medication': 'İlaç'
        , 'prescriptions.type.insulin': 'İnsülin'
        , 'prescriptions.type.sensor': 'Sensör'
        , 'prescriptions.type.device': 'Cihaz'
        , 'labs.title': 'Laboratuvar Sonuçları'
        , 'labs.subtitle': 'Laboratuvar testlerinizi görüntüleyin ve dosya ekleyin.'
        , 'labs.btn.add': 'Yeni Sonuç Ekle'
        , 'labs.btn.printAll': 'Tümünü Yazdır'
        , 'labs.filters.title': 'Filtre'
        , 'labs.filters.type': 'Test Türü'
        , 'labs.filters.typeAll': 'Tümü'
        , 'labs.results.title': 'Sonuçlar'
        , 'labs.msg.noResults': 'Sonuç bulunamadı'
        , 'labs.form.title': 'Yeni Laboratuvar Sonucu Ekle'
        , 'labs.form.dateLabel': 'Tarih'
        , 'labs.form.typeLabel': 'Test Türü'
        , 'labs.form.valueLabel': 'Değer'
        , 'labs.form.unitLabel': 'Birim'
        , 'labs.form.refLowLabel': 'Referans (Düşük)'
        , 'labs.form.refHighLabel': 'Referans (Yüksek)'
        , 'labs.form.notesLabel': 'Notlar'
        , 'labs.form.uploadLabel': 'Dosya (PDF / Görsel)'
        , 'labs.form.submit': 'Kaydet'

        // Carb page
        , 'carb.title': 'Karbonhidrat Hesaplayıcı'
        , 'carb.subtitle': 'Yiyecekleri seçin, porsiyon ekleyin ve öğünlerinizi kaydedin.'
        , 'carb.search': 'Ara'
        , 'carb.mealType': 'Öğün'
        , 'carb.mealType.breakfast': 'Kahvaltı'
        , 'carb.mealType.lunch': 'Öğle'
        , 'carb.mealType.dinner': 'Akşam'
        , 'carb.mealType.snack': 'Ara Öğün'
        , 'carb.clearMeal': 'Temizle'
        , 'carb.resetAll': 'Sıfırla'
        , 'carb.foodLibrary': 'Yiyecek Kütüphanesi'
        , 'carb.food': 'Yiyecek'
        , 'carb.defaultGram': 'Porsiyon (g)'
        , 'carb.carbsPerPortion': 'Karbonhidrat / porsiyon (g)'
        , 'carb.portions': 'Porsiyon'
        , 'carb.actions': 'İşlemler'
        , 'carb.currentMeal': 'Mevcut Öğün'
        , 'carb.grams': 'Gram'
        , 'carb.carbs': 'Karbonhidrat (g)'
        , 'carb.mealTotal': 'Toplam:'
        , 'carb.saveMeal': 'Öğünü Kaydet'
        , 'carb.print': 'Yazdır'
        , 'carb.dailySummary': 'Günlük Özet'
        , 'carb.dailyTotal': 'Günlük toplam'
        // Carb errors
        , 'carb.add': 'Ekle'
        , 'carb.unit': 'Birim'
        , 'carb.unit.g': 'g'
        , 'carb.unit.pcs': 'Adet'
        , 'carb.unit.tbsp': 'Yemek Kaşığı'
        , 'carb.qty': 'Miktar'
        , 'carb.totalLabel': 'Toplam Karbonhidrat:'
        , 'carb.err.noFood': 'Lütfen bir yiyecek seçin.'
        , 'carb.err.unknown': 'Seçilen yiyecek bulunamadı.'
        , 'carb.err.unitUnavailable': 'Seçilen birim bu yiyecek için uygun değil.'
        , 'carb.manualEntry': 'Manuel Ekle'
        , 'carb.customPerUnit': 'Karbonhidrat (seçilen birim başına)'
        , 'carb.err.customRequired': 'Lütfen seçilen birim için karbonhidrat değerini girin.'

        // Maps page
        , 'maps.nearby': 'Yakın Hastaneler'
        , 'maps.emergency': 'Acil'
        , 'maps.call112': "112'yi Ara"
        , 'maps.warning': 'Acil durumlarda 112 ile iletişime geçin veya en yakın sağlık kuruluşuna gidin.'
        , 'maps.facilities': 'Tesisler'
        , 'maps.openInGoogle': 'Google Haritalarında Aç'
        , 'maps.distanceKm': 'km'
        , 'maps.you': 'Siz'
        , 'maps.findHospitals': 'En Yakın Hastaneleri Bul'
        , 'maps.findPharmacies': 'Nöbetçi Eczaneleri Bul'
        , 'maps.loading': 'Yükleniyor...'
        , 'maps.gpsDisabled': 'GPS konumu bulunamadı veya izin verilmedi.'
        , 'maps.noResults': 'Yakın çevrede sonuç bulunamadı.',
        'maps.directions': 'Yol Tarifi',
        'logs.title': 'Tıbbi Kayıtlar',
        'logs.create': 'Kayıt Oluştur',
        'logs.type': 'Kayıt Türü',
        'logs.type.prescription': 'Reçete',
        'logs.type.lab_request': 'Laboratuvar İsteği',
        'logs.type.adjustment': 'İnsülin Ayarı',
        'logs.type.diagnosis': 'Teşhis',
        'logs.type.comment': 'Yorum',
        'logs.description': 'Açıklama',
        'logs.date': 'Tarih',
        'logs.doctor': 'Doktor',
        'logs.history': 'Kayıt Geçmişi',
        'logs.loading': 'Yükleniyor...',
        'logs.no_logs': 'Kayıt bulunamadı',
        'logs.filter': 'Türe göre filtrele',
        'pdf.title': 'Tıbbi Rapor',
        'pdf.patient': 'Hasta Bilgileri',
        'pdf.logs': 'Tıbbi Kayıtlar',
        'pdf.prescriptions': 'Reçeteler',
        'pdf.labs': 'Laboratuvar İstekleri',
        'pdf.glucose': 'Glukoz Geçmişi',
        'pdf.generated': 'Oluşturulma Tarihi',
        'pdf.project': 'Sistem: DİYABETLİYİM',
        'admin.doctors_pending': 'Onay Bekleyen Doktorlar',
        'admin.approve': 'Onayla',
        'admin.reject': 'Reddet',
        'admin.no_pending': 'Onay bekleyen doktor yok',
        'appointments.title': 'Randevular',
        'appointments.request': 'Randevu İste',
        'appointments.reason': 'Sebep',
        'appointments.date': 'Randevu Tarihi',
        'appointments.status.pending': 'Bekliyor',
        'appointments.status.approved': 'Onaylandı',
        'appointments.status.rejected': 'Reddedildi',
        'appointments.status.rescheduled': 'Yeniden Planlandı',
        'appointments.cancel': 'İptal Et',
        'appointments.print': 'Yazdır'
    },
    en: {
        // General
        'home': 'Home',
        'login': 'Login',
        'print': 'Print',
        'edit': 'Edit',
        'delete': 'Delete',
        'actions': 'Actions',
        'notes': 'Notes',
        'notifications.empty': 'No notifications',
        'footer.copy': '© 2025 DIABETELIM',

        // Profile
        'profile.view': 'Profile',
        'profile.edit': 'Edit Info',
        'profile.password': 'Change Password',
        'profile.logout': 'Logout',

        // Menu
        'menu.daily': 'Daily Measurements',
        'card.history': 'History & Print',
        'card.appointments': 'Appointments',
        'card.prescriptions': 'Prescriptions',
        'card.labs': 'Lab Reports',
        'card.carb': 'Carb Calculator',
        'card.maps': 'Maps',

        // Patient Dashboard
        'title.patientDashboard': 'Patient Dashboard - DIABETELIM',
        'daily.title': 'Daily Glucose Measurements',
        'daily.fasting': 'Fasting',
        'daily.beforeBreakfast': 'Before Breakfast',
        'daily.afterBreakfast': 'After Breakfast',
        'daily.breakfastCarbs': 'Breakfast Carbs',
        'daily.breakfastInsulin': 'Breakfast Insulin',
        'daily.snack1': 'Snack 1',
        'daily.beforeLunch': 'Before Lunch',
        'daily.afterLunch': 'After Lunch',
        'daily.lunchCarbs': 'Lunch Carbs',
        'daily.lunchInsulin': 'Lunch Insulin',
        'daily.snack2': 'Snack 2',
        'daily.beforeDinner': 'Before Dinner',
        'daily.afterDinner': 'After Dinner',
        'daily.dinnerCarbs': 'Dinner Carbs',
        'daily.dinnerInsulin': 'Dinner Insulin',
        'daily.snack3': 'Snack 3',
        'daily.lantus': 'Lantus',
        'daily.measurement_12am': '12 AM Measurement',
        'daily.measurement_3am': '3 AM Measurement',
        'daily.save': 'Save',
        'warning.high': 'High critical glucose detected',
        'warning.low': 'Hypoglycemia risk detected',

        // History Page
        'history.title': 'Measurement History',
        'filter.start': 'Start date',
        'filter.end': 'End date',
        'filter.apply': 'Apply',
        'filter.clear': 'Clear',
        'results.title': 'Results',
        'results.count_suffix': 'records found',
        'day': 'Day',
        'no_measurements': 'No measurements found',
        'confirm.delete': 'Are you sure you want to delete this record?',

        // Appointments Page
        'appointments.title': 'My Appointments',
        'appointments.subtitle': 'Manage your upcoming appointments and book new ones.',
        'appointments.form.title': 'Book a New Appointment',
        'appointments.form.doctorLabel': 'Select Doctor',
        'appointments.form.doctorPlaceholder': 'Choose a doctor...',
        'appointments.form.dateLabel': 'Date',
        'appointments.form.timeLabel': 'Time',
        'appointments.form.typeLabel': 'Appointment Type',
        'appointments.form.type.clinic': 'Clinic',
        'appointments.form.type.online': 'Online',
        'appointments.form.type.emergency': 'Emergency',
        'appointments.form.notesLabel': 'Notes',
        'appointments.form.notesPlaceholder': 'Additional notes for the appointment...',
        'appointments.form.submit': 'Book Appointment',
        'appointments.msg.validationError': 'Please fill in all required fields.',
        'appointments.upcoming.title': 'Upcoming Appointments',
        'appointments.msg.noAppointments': 'No upcoming appointments.',
        'appointments.table.header.date': 'Date',
        'appointments.table.header.time': 'Time',
        'appointments.table.header.doctor': 'Doctor',
        'appointments.table.header.type': 'Type',
        'appointments.table.header.status': 'Status',
        'appointments.actions.cancel': 'Cancel',
        'appointments.actions.details': 'Details',

        // Prescriptions Page
        'prescriptions.title': 'Insulin & Sensor Prescriptions',
        'prescriptions.subtitle': 'View your active and past prescriptions.',
        'prescriptions.active.title': 'Active Prescriptions',
        'prescriptions.warning.expiringSoon': 'Expiring soon!',
        'prescriptions.insulin.title': 'Insulin Prescription',
        'prescriptions.sensor.title': 'Sensor Prescription',
        'prescriptions.label.type': 'Type',
        'prescriptions.label.units': 'Units',
        'prescriptions.label.issued': 'Issued Date',
        'prescriptions.label.expires': 'Expires Date',
        'prescriptions.button.viewAll': 'View All',
        'prescriptions.empty': 'No active prescription.',
        'prescriptions.history.title': 'Prescription History',
        'prescriptions.history.show': 'Show History',
        'prescriptions.history.hide': 'Hide History',
        'prescriptions.history.empty': 'No prescription history.',
        'prescriptions.button.download': 'Download',
        'prescriptions.button.print': 'Print',
        'prescriptions.button.downloadAll': 'Download All',
        'prescriptions.button.printAll': 'Print All',
        'prescriptions.status.expired': 'Expired',
        'prescriptions.status.replaced': 'Replaced'
        ,
        // Prescriptions page (presc.*)
        'presc.pageTitle': 'Prescriptions',
        'presc.subtitle': 'View your active and past prescriptions.',
        'presc.insulinTitle': 'Insulin Prescription',
        'presc.sensorTitle': 'Sensor (CGM) Prescription',
        'presc.typeLabel': 'Type',
        'presc.doseLabel': 'Dose',
        'presc.issuedLabel': 'Issued',
        'presc.noData': '---',
        'presc.print': 'Print',
        'presc.request': 'Request New Prescription',
        'presc.sensorTypeLabel': 'Type',
        'presc.insulinType': 'Insulin Type',
        'presc.insulinDose': 'Dose',
        'presc.insulinDate': 'Issued Date',
        'presc.sensorName': 'Sensor',
        'presc.sensorDate': 'Issued Date'
        ,
        // New prescription keys
        'pres.title': 'Prescriptions',
        'pres.type': 'Medication Type',
        'pres.name': 'Medicine Name',
        'pres.dose': 'Dose',
        'pres.freq': 'Frequency',
        'pres.duration': 'Duration',
        'pres.notes': 'Notes',
        'pres.print': 'Print',
        'pres.renew': 'Request Renewal',
        'pres.create': 'Create Prescription'
        ,
        // New prescription keys
        'pres.title': 'Reçeteler',
        'pres.type': 'İlaç Türü',
        'pres.name': 'İlaç Adı',
        'pres.dose': 'Doz',
        'pres.freq': 'Sıklık',
        'pres.duration': 'Süre',
        'pres.notes': 'Notlar',
        'pres.print': 'Yazdır',
        'pres.renew': 'Yenileme İste',
        'pres.create': 'Reçete Oluştur'
        // Labs page
        , 'labs.title': 'Lab Reports'
        , 'labs.subtitle': 'View your lab tests and attach files.'
        , 'labs.btn.add': 'Add Result'
        , 'labs.btn.printAll': 'Print All'
        , 'labs.filters.title': 'Filter'
        , 'labs.filters.type': 'Test Type'
        , 'labs.filters.typeAll': 'All'
        , 'labs.results.title': 'Results'
        , 'labs.msg.noResults': 'No results found'
        , 'labs.form.title': 'Add New Lab Result'
        , 'labs.form.dateLabel': 'Date'
        , 'labs.form.typeLabel': 'Test Type'
        , 'labs.form.valueLabel': 'Value'
        , 'labs.form.unitLabel': 'Unit'
        , 'labs.form.refLowLabel': 'Reference (Low)'
        , 'labs.form.refHighLabel': 'Reference (High)'
        , 'labs.form.notesLabel': 'Notes'
        , 'labs.form.uploadLabel': 'File (PDF / Image)'
        , 'labs.form.submit': 'Save'

        // Carb page
        , 'carb.title': 'Carb Calculator'
        , 'carb.subtitle': 'Select foods, add portions and save your meals.'
        , 'carb.search': 'Search'
        , 'carb.mealType': 'Meal'
        , 'carb.mealType.breakfast': 'Breakfast'
        , 'carb.mealType.lunch': 'Lunch'
        , 'carb.mealType.dinner': 'Dinner'
        , 'carb.mealType.snack': 'Snack'
        , 'carb.clearMeal': 'Clear'
        , 'carb.resetAll': 'Reset All'
        , 'carb.foodLibrary': 'Food Library'
        , 'carb.food': 'Food'
        , 'carb.defaultGram': 'Portion (g)'
        , 'carb.carbsPerPortion': 'Carbs / portion (g)'
        , 'carb.portions': 'Portions'
        , 'carb.actions': 'Actions'
        , 'carb.currentMeal': 'Current Meal'
        , 'carb.grams': 'Grams'
        , 'carb.carbs': 'Carbs (g)'
        , 'carb.mealTotal': 'Total:'
        , 'carb.saveMeal': 'Save Meal'
        , 'carb.print': 'Print'
        , 'carb.dailySummary': 'Daily Summary'
        , 'carb.dailyTotal': 'Daily total'
        , 'carb.add': 'Add'
        , 'carb.unit': 'Unit'
        , 'carb.unit.g': 'g'
        , 'carb.unit.pcs': 'pcs'
        , 'carb.unit.tbsp': 'Tbsp'
        , 'carb.qty': 'Quantity'
        , 'carb.totalLabel': 'Total Carbs:'
        , 'carb.err.noFood': 'Please choose a food.'
        , 'carb.err.unknown': 'Selected food not found.'
        , 'carb.err.unitUnavailable': 'Selected unit is not available for this food.'
        , 'carb.manualEntry': 'Manual entry'
        , 'carb.customPerUnit': 'Carbs (per selected unit)'
        , 'carb.err.customRequired': 'Please enter carbs for the chosen unit.'

        // Maps page
        , 'maps.nearby': 'Nearest hospital'
        , 'maps.emergency': 'Emergency'
        , 'maps.call112': 'Call 112'
        , 'maps.warning': 'In emergency, call 112 or go to the nearest health facility.'
        , 'maps.facilities': 'Facilities'
        , 'maps.openInGoogle': 'Open in Google Maps'
        , 'maps.distanceKm': 'km'
        , 'maps.you': 'You'
        , 'maps.findHospitals': 'Find Nearest Hospitals'
        , 'maps.findPharmacies': 'Find Duty Pharmacies'
        , 'maps.loading': 'Loading...'
        , 'maps.gpsDisabled': 'GPS location not available or permission denied.'
        , 'maps.noResults': 'No results found nearby.',
        'maps.directions': 'Directions',
        'logs.title': 'Medical Logs',
        'logs.create': 'Create Log',
        'logs.type': 'Log Type',
        'logs.type.prescription': 'Prescription',
        'logs.type.lab_request': 'Lab Request',
        'logs.type.adjustment': 'Insulin Adjustment',
        'logs.type.diagnosis': 'Diagnosis',
        'logs.type.comment': 'Comment',
        'logs.description': 'Description',
        'logs.date': 'Date',
        'logs.doctor': 'Doctor',
        'logs.history': 'Log History',
        'logs.loading': 'Loading...',
        'logs.no_logs': 'No logs found',
        'logs.filter': 'Filter by Type',
        'pdf.title': 'Medical Report',
        'pdf.patient': 'Patient Information',
        'pdf.logs': 'Medical Logs',
        'pdf.prescriptions': 'Prescriptions',
        'pdf.labs': 'Lab Requests',
        'pdf.glucose': 'Glucose History',
        'pdf.generated': 'Generated on',
        'pdf.project': 'System: DİYABETLİYİM',
        'admin.doctors_pending': 'Pending Doctors',
        'admin.approve': 'Approve',
        'admin.reject': 'Reject',
        'admin.no_pending': 'No doctors awaiting approval',
        'appointments.title': 'Appointments',
        'appointments.request': 'Request Appointment',
        'appointments.reason': 'Reason',
        'appointments.date': 'Appointment Date',
        'appointments.status.pending': 'Pending',
        'appointments.status.approved': 'Approved',
        'appointments.status.rejected': 'Rejected',
        'appointments.status.rescheduled': 'Rescheduled',
        'appointments.cancel': 'Cancel',
        'appointments.print': 'Print'
    },
    ar: {
        // General
        'home': 'الصفحة الرئيسية',
        'login': 'تسجيل الدخول',
        'print': 'طباعة',
        'edit': 'تعديل',
        'delete': 'حذف',
        'actions': 'الإجراءات',
        'notes': 'ملاحظات',
        'notifications.empty': 'لا توجد إشعارات',
        'footer.copy': '© 2025 ديابيتليم',

        // Profile
        'profile.view': 'الملف الشخصي',
        'profile.edit': 'تعديل المعلومات',
        'profile.password': 'تغيير كلمة المرور',
        'profile.logout': 'تسجيل الخروج',

        // Menu
        'menu.daily': 'القياسات اليومية',
        'card.history': 'السجل والطباعة',
        'card.appointments': 'المواعيد',
        'card.prescriptions': 'الوصفات الطبية',
        'card.labs': 'المختبر',
        'card.carb': 'حاسبة الكربوهيدرات',
        'card.maps': 'الخرائط',

        // Patient Dashboard
        'title.patientDashboard': 'لوحة المريض - ديابيتليم',
        'daily.title': 'قياسات الجلوكوز اليومية',
        'daily.fasting': 'صيام',
        'daily.beforeBreakfast': 'قبل الإفطار',
        'daily.afterBreakfast': 'بعد الإفطار',
        'daily.breakfastCarbs': 'كربوهيدرات الإفطار',
        'daily.breakfastInsulin': 'أنسولين الإفطار',
        'daily.snack1': 'وجبة خفيفة 1',
        'daily.beforeLunch': 'قبل الغداء',
        'daily.afterLunch': 'بعد الغداء',
        'daily.lunchCarbs': 'كربوهيدرات الغداء',
        'daily.lunchInsulin': 'أنسولين الغداء',
        'daily.snack2': 'وجبة خفيفة 2',
        'daily.beforeDinner': 'قبل العشاء',
        'daily.afterDinner': 'بعد العشاء',
        'daily.dinnerCarbs': 'كربوهيدرات العشاء',
        'daily.dinnerInsulin': 'أنسولين العشاء',
        'daily.snack3': 'وجبة خفيفة 3',
        'daily.lantus': 'لانتوس',
        'daily.measurement_12am': 'قياس الساعة 12 صباحًا',
        'daily.measurement_3am': 'قياس الساعة 3 صباحًا',
        'daily.save': 'حفظ',
        'warning.high': 'تم اكتشاف مستوى جلوكوز حرج مرتفع',
        'warning.low': 'تم اكتشاف خطر نقص السكر في الدم',

        // History Page
        'history.title': 'سجل القياسات',
        'filter.start': 'تاريخ البدء',
        'filter.end': 'تاريخ الانتهاء',
        'filter.apply': 'تطبيق',
        'filter.clear': 'مسح',
        'results.title': 'النتائج',
        'results.count_suffix': 'سجلات تم العثور عليها',
        'day': 'اليوم',
        'no_measurements': 'لم يتم العثور على قياسات',
        'confirm.delete': 'هل أنت متأكد أنك تريد حذف هذا السجل؟',

        // Appointments Page
        'appointments.title': 'مواعيدي',
        'appointments.subtitle': 'إدارة مواعيدك القادمة وحجز مواعيد جديدة.',
        'appointments.form.title': 'حجز موعد جديد',
        'appointments.form.doctorLabel': 'اختر الطبيب',
        'appointments.form.doctorPlaceholder': 'اختر طبيبًا...',
        'appointments.form.dateLabel': 'التاريخ',
        'appointments.form.timeLabel': 'الوقت',
        'appointments.form.typeLabel': 'نوع الموعد',
        'appointments.form.type.clinic': 'عيادة',
        'appointments.form.type.online': 'عبر الإنترنت',
        'appointments.form.type.emergency': 'طوارئ',
        'appointments.form.notesLabel': 'ملاحظات',
        'appointments.form.notesPlaceholder': 'ملاحظات إضافية للموعد...',
        'appointments.form.submit': 'حجز الموعد',
        'appointments.msg.validationError': 'يرجى ملء جميع الحقول المطلوبة.',
        'appointments.upcoming.title': 'المواعيد القادمة',
        'appointments.msg.noAppointments': 'لا توجد مواعيد قادمة.',
        'appointments.table.header.date': 'التاريخ',
        'appointments.table.header.time': 'الوقت',
        'appointments.table.header.doctor': 'الطبيب',
        'appointments.table.header.type': 'النوع',
        'appointments.table.header.status': 'الحالة',
        'appointments.actions.cancel': 'إلغاء',
        'appointments.actions.details': 'تفاصيل',

        // Prescriptions Page
        'prescriptions.title': 'وصفات الأنسولين والمستشعرات',
        'prescriptions.subtitle': 'عرض وصفاتك الطبية الحالية والسابقة.',
        'prescriptions.active.title': 'الوصفات النشطة',
        'prescriptions.warning.expiringSoon': 'ستنتهي قريباً!',
        'prescriptions.insulin.title': 'وصفة الأنسولين',
        'prescriptions.sensor.title': 'وصفة المستشعر',
        'prescriptions.label.type': 'النوع',
        'prescriptions.label.units': 'وحدات',
        'prescriptions.label.issued': 'تاريخ الإصدار',
        'prescriptions.label.expires': 'تاريخ الانتهاء',
        'prescriptions.button.viewAll': 'عرض الكل',
        'prescriptions.empty': 'لا توجد وصفة طبية نشطة.',
        'prescriptions.history.title': 'سجل الوصفات',
        'prescriptions.history.show': 'إظهار السجل',
        'prescriptions.history.hide': 'إخفاء السجل',
        'prescriptions.history.empty': 'لا يوجد سجل للوصفات.',
        'prescriptions.button.download': 'تنزيل',
        'prescriptions.button.print': 'طباعة',
        'prescriptions.button.downloadAll': 'تنزيل الكل',
        'prescriptions.button.printAll': 'طباعة الكل',
        'prescriptions.status.expired': 'منتهية الصلاحية',
        'prescriptions.status.replaced': 'تم استبدالها'
        ,
        // Prescriptions page (presc.*)
        'presc.pageTitle': 'الوصفات الطبية',
        'presc.subtitle': 'عرض وصفاتك النشطة والسابقة.',
        'presc.insulinTitle': 'وصفة الأنسولين',
        'presc.sensorTitle': 'وصفة المستشعر (CGM)',
        'presc.typeLabel': 'النوع',
        'presc.doseLabel': 'الجرعة',
        'presc.issuedLabel': 'تاريخ الإصدار',
        'presc.noData': '---',
        'presc.print': 'طباعة',
        'presc.request': 'طلب وصفة جديدة',
        'presc.sensorTypeLabel': 'النوع',
        'presc.insulinType': 'نوع الأنسولين',
        'presc.insulinDose': 'الجرعة',
        'presc.insulinDate': 'تاريخ الإصدار',
        'presc.sensorName': 'المستشعر',
        'presc.sensorDate': 'تاريخ الإصدار'
        ,
        // New prescription keys
        'pres.title': 'الوصفات الطبية',
        'pres.type': 'نوع الدواء',
        'pres.name': 'اسم الدواء',
        'pres.dose': 'الجرعة',
        'pres.freq': 'التكرار',
        'pres.duration': 'المدة',
        'pres.notes': 'ملاحظات',
        'pres.print': 'طباعة',
        'pres.renew': 'طلب تجديد',
        'pres.create': 'إنشاء وصفة'
        // Labs page
        , 'labs.title': 'نتائج المختبر'
        , 'labs.subtitle': 'عرض فحوصات المختبر وإرفاق الملفات.'
        , 'labs.btn.add': 'إضافة نتيجة'
        , 'labs.btn.printAll': 'طباعة الكل'
        , 'labs.filters.title': 'تصفية'
        , 'labs.filters.type': 'نوع الفحص'
        , 'labs.filters.typeAll': 'الكل'
        , 'labs.results.title': 'النتائج'
        , 'labs.msg.noResults': 'لا توجد نتائج'
        , 'labs.form.title': 'إضافة نتيجة مختبر جديدة'
        , 'labs.form.dateLabel': 'التاريخ'
        , 'labs.form.typeLabel': 'نوع الفحص'
        , 'labs.form.valueLabel': 'القيمة'
        , 'labs.form.unitLabel': 'الوحدة'
        , 'labs.form.refLowLabel': 'المرجع (منخفض)'
        , 'labs.form.refHighLabel': 'المرجع (مرتفع)'
        , 'labs.form.notesLabel': 'ملاحظات'
        , 'labs.form.uploadLabel': 'ملف (PDF / صورة)'
        , 'labs.form.submit': 'حفظ'

        // Carb page
        , 'carb.title': 'حاسبة الكربوهيدرات'
        , 'carb.subtitle': 'اختر الأطعمة، أضف الحصص واحفظ وجباتك.'
        , 'carb.search': 'بحث'
        , 'carb.mealType': 'وجبة'
        , 'carb.mealType.breakfast': 'إفطار'
        , 'carb.mealType.lunch': 'غداء'
        , 'carb.mealType.dinner': 'عشاء'
        , 'carb.mealType.snack': 'وجبة خفيفة'
        , 'carb.clearMeal': 'مسح'
        , 'carb.resetAll': 'إعادة تعيين الكل'
        , 'carb.foodLibrary': 'مكتبة الطعام'
        , 'carb.food': 'طعام'
        , 'carb.defaultGram': 'حصة (غ)'
        , 'carb.carbsPerPortion': 'كربوهيدرات / الحصة (غ)'
        , 'carb.portions': 'حصص'
        , 'carb.actions': 'إجراءات'
        , 'carb.currentMeal': 'الوجبة الحالية'
        , 'carb.grams': 'غرام'
        , 'carb.carbs': 'كربوهيدرات (غ)'
        , 'carb.mealTotal': 'المجموع:'
        , 'carb.saveMeal': 'حفظ الوجبة'
        , 'carb.print': 'طباعة'
        , 'carb.dailySummary': 'ملخص اليوم'
        , 'carb.dailyTotal': 'المجموع اليومي'
        , 'carb.add': 'إضافة'
        , 'carb.unit': 'الوحدة'
        , 'carb.unit.g': 'غ'
        , 'carb.unit.pcs': 'قطعة'
        , 'carb.unit.tbsp': 'ملعقة'
        , 'carb.qty': 'الكمية'
        , 'carb.totalLabel': 'إجمالي الكربوهيدرات:'
        , 'carb.err.noFood': 'الرجاء اختيار طعام.'
        , 'carb.err.unknown': 'الطعام المحدد غير موجود.'
        , 'carb.err.unitUnavailable': 'الوحدة المحددة غير متاحة لهذا الطعام.'
        , 'carb.manualEntry': 'إدخال يدوي'
        , 'carb.customPerUnit': 'الكربوهيدرات (لكل وحدة مختارة)'
        , 'carb.err.customRequired': 'الرجاء إدخال الكربوهيدرات للوحدة المختارة.'

        // Maps page
        , 'maps.nearby': ' أقرب مشفى'
        , 'maps.emergency': 'حالات الطوارئ'
        , 'maps.call112': 'اتصال بالرقم 112'
        , 'maps.warning': 'في حالات الطوارئ اتصل بالرقم 112 أو توجه إلى أقرب منشأة طبية.'
        , 'maps.facilities': 'المرافق'
        , 'maps.openInGoogle': 'فتح في خرائط Google'
        , 'maps.distanceKm': 'كم',
        'maps.you': 'أنت',
        'logs.title': 'السجلات الطبية',
        'logs.create': 'إنشاء سجل',
        'logs.type': 'نوع السجل',
        'logs.type.prescription': 'وصفة',
        'logs.type.lab_request': 'طلب مختبر',
        'logs.type.adjustment': 'تعديل الأنسولين',
        'logs.type.diagnosis': 'تشخيص',
        'logs.type.comment': 'تعليق',
        'logs.description': 'الوصف',
        'logs.date': 'التاريخ',
        'logs.doctor': 'الطبيب',
        'logs.history': 'سجل السجلات',
        'logs.loading': 'جارٍ التحميل...',
        'logs.no_logs': 'لا توجد سجلات',
        'logs.filter': 'تصفية حسب النوع',
        'pdf.title': 'التقرير الطبي',
        'pdf.patient': 'معلومات المريض',
        'pdf.logs': 'السجلات الطبية',
        'pdf.prescriptions': 'الوصفات الطبية',
        'pdf.labs': 'طلبات المختبر',
        'pdf.glucose': 'تاريخ الجلوكوز',
        'pdf.generated': 'تم إنشاؤه في',
        'pdf.project': 'النظام: ديابيتليم',
        'admin.doctors_pending': 'الأطباء المعلقون',
        'admin.approve': 'موافقة',
        'admin.reject': 'رفض',
        'admin.no_pending': 'لا يوجد أطباء في انتظار الموافقة',
        'appointments.title': 'المواعيد',
        'appointments.request': 'طلب موعد',
        'appointments.reason': 'السبب',
        'appointments.date': 'تاريخ الموعد',
        'appointments.status.pending': 'معلق',
        'appointments.status.approved': 'موافق عليه',
        'appointments.status.rejected': 'مرفوض',
        'appointments.status.rescheduled': 'أعيد جدولته',
        'appointments.cancel': 'إلغاء',
        'appointments.print': 'طباعة'
    }
};

function t(key) {
    const lang = localStorage.getItem('lang') || 'tr';
    const translation = (i18n[lang] && i18n[lang][key]) || (i18n['tr'] && i18n['tr'][key]) || key;
    return translation;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const txt = t(key);
        const targetAttr = el.getAttribute('data-i18n-target');

        if (targetAttr) {
            el.setAttribute(targetAttr, txt);
        } else if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
            el.placeholder = txt;
        } else {
            el.textContent = txt;
        }
    });
}

// Apply translations on initial load
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('lang')) {
        localStorage.setItem('lang', 'tr');
    }
    // Ensure document language is set so assistive tech and browsers know primary language
    document.documentElement.lang = localStorage.getItem('lang') || 'tr';
    applyTranslations();

    // Handle language switcher clicks
    document.querySelectorAll('.lang-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-lang');
            if (!code) return;
            localStorage.setItem('lang', code);
            document.documentElement.lang = code;
            applyTranslations();
        });
    });
});
