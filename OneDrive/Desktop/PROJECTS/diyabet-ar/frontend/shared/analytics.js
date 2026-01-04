
class AnalyticsManager {
  constructor(containerId, userRole) {
    this.container = document.getElementById(containerId);
    this.userRole = userRole;
    this.currentPatientId = null;
    this.charts = {};
    this.init();
  }

  async init() {
    if (typeof Chart === 'undefined') {
      await this.loadChartJS();
    }

    if (this.userRole === 'doctor') {
      const urlParams = new URLSearchParams(window.location.search);
      this.currentPatientId = urlParams.get('patientId');
    }

    this.renderUI();
    await this.loadAnalytics();
  }

  async loadChartJS() {
    // For local dev, download Chart.js and place in assets/js if needed.
    // Example:
    // const script = document.createElement('script');
    // script.src = 'assets/js/chart.umd.min.js';
    // script.onload = resolve;
    // script.onerror = reject;
    // document.head.appendChild(script);
    return Promise.resolve();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="analytics-container">
        <div class="analytics-header">
          <h1>
            <i class="fas fa-chart-line"></i>
            تحليل الجلوكوز
          </h1>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="analytics-card-header">
              <h2>
                <i class="fas fa-calendar-week"></i>
                الاتجاه الأسبوعي
              </h2>
              <span class="period-badge">آخر 7 أيام</span>
            </div>
            <div class="chart-container">
              <canvas id="weeklyChart"></canvas>
            </div>
            <div id="weeklyStats" class="stats-grid"></div>
          </div>

          <div class="analytics-card">
            <div class="analytics-card-header">
              <h2>
                <i class="fas fa-calendar-alt"></i>
                الاتجاه الشهري
              </h2>
              <span class="period-badge">آخر 30 يوم</span>
            </div>
            <div class="chart-container">
              <canvas id="monthlyChart"></canvas>
            </div>
            <div id="monthlyStats" class="stats-grid"></div>
          </div>

          <div class="analytics-card">
            <div class="analytics-card-header">
              <h2>
                <i class="fas fa-percentage"></i>
                النطاق المستهدف
              </h2>
            </div>
            <div class="time-in-range">
              <div class="range-bar" id="rangeBar"></div>
            </div>
          </div>

          ${this.userRole === 'doctor' ? `
          <div class="analytics-card">
            <div class="analytics-card-header">
              <h2>
                <i class="fas fa-syringe"></i>
                تأثير الأنسولين
              </h2>
            </div>
            <div id="insulinImpactContent"></div>
          </div>
          ` : ''}

          <div class="analytics-card risk-flags-container">
            <div class="analytics-card-header">
              <h2>
                <i class="fas fa-exclamation-triangle"></i>
                تحذيرات المخاطر
              </h2>
            </div>
            <div class="risk-flags" id="riskFlags"></div>
          </div>
        </div>
      </div>
    `;
  }

  async loadAnalytics() {
    try {
      const token = localStorage.getItem('token');
      const patientParam = this.currentPatientId ? `?patientId=${this.currentPatientId}` : '';

      const [weekly, monthly, trends, insulin] = await Promise.all([
        fetch(`/api/analytics/glucose/weekly${patientParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

        fetch(`/api/analytics/glucose/monthly${patientParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

        fetch(`/api/analytics/glucose/trends${patientParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

        this.userRole === 'doctor'
          ? fetch(`/api/analytics/glucose/insulin-impact${patientParam}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json())
          : Promise.resolve(null)
      ]);

      this.renderWeeklyChart(weekly.weekly);
      this.renderMonthlyChart(monthly.monthly);
      this.renderTimeInRange(trends.timeInRange);
      this.renderRiskFlags(trends.recommendations);

      if (insulin && this.userRole === 'doctor') {
        this.renderInsulinImpact(insulin.insulinImpact);
      }
    } catch (err) {
      console.error('خطأ في تحميل التحليلات:', err);
    }
  }

  renderWeeklyChart(data) {
    const ctx = document.getElementById('weeklyChart');
    if (this.charts.weekly) this.charts.weekly.destroy();

    this.charts.weekly = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.days.map(d =>
          new Date(d._id).toLocaleDateString('ar-SA', { weekday: 'short' })
        ),
        datasets: [
          {
            label: 'المتوسط',
            data: data.days.map(d => d.avgGlucose),
            borderColor: '#20caa8',
            backgroundColor: 'rgba(32, 202, 168, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'الأعلى',
            data: data.days.map(d => d.maxGlucose),
            borderColor: '#f97316',
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
          },
          {
            label: 'الأدنى',
            data: data.days.map(d => d.minGlucose),
            borderColor: '#3b82f6',
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'mg/dL' }
          }
        }
      }
    });

    document.getElementById('weeklyStats').innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${data.average}</div>
        <div class="stat-label">متوسط mg/dL</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.max(...data.days.map(d => d.maxGlucose))}</div>
        <div class="stat-label">الذروة</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.min(...data.days.map(d => d.minGlucose))}</div>
        <div class="stat-label">الأدنى</div>
      </div>
    `;
  }

  renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart');
    if (this.charts.monthly) this.charts.monthly.destroy();

    const sampledData = data.days.filter((_, i) => i % 3 === 0);

    this.charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sampledData.map(d =>
          new Date(d._id).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: 'متوسط الجلوكوز',
          data: sampledData.map(d => d.avgGlucose),
          backgroundColor: sampledData.map(d => {
            if (d.avgGlucose > 180) return 'rgba(249, 115, 22, 0.7)';
            if (d.avgGlucose < 80) return 'rgba(59, 130, 246, 0.7)';
            return 'rgba(32, 202, 168, 0.7)';
          })
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'mg/dL' }
          }
        }
      }
    });

    document.getElementById('monthlyStats').innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${data.average}</div>
        <div class="stat-label">متوسط mg/dL</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.days.length}</div>
        <div class="stat-label">الأيام المتتبعة</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.weeklyBreakdown.length}</div>
        <div class="stat-label">أسبوع</div>
      </div>
    `;
  }

  renderTimeInRange(timeInRange) {
    document.getElementById('rangeBar').innerHTML = `
      <div class="range-segment very-low" style="width:${timeInRange.veryLow}%"></div>
      <div class="range-segment low" style="width:${timeInRange.low}%"></div>
      <div class="range-segment target" style="width:${timeInRange.target}%">
        ${timeInRange.target}%
      </div>
      <div class="range-segment high" style="width:${timeInRange.high}%"></div>
      <div class="range-segment very-high" style="width:${timeInRange.veryHigh}%"></div>
    `;
  }

  renderRiskFlags(recommendations) {
    const icons = {
      warning: 'fa-exclamation-triangle',
      danger: 'fa-exclamation-circle',
      info: 'fa-info-circle',
      success: 'fa-check-circle'
    };

    document.getElementById('riskFlags').innerHTML = recommendations.map(rec => `
      <div class="risk-flag ${rec.type}">
        <div class="risk-flag-icon">
          <i class="fas ${icons[rec.type]}"></i>
        </div>
        <div class="risk-flag-content">
          <h4>${rec.message}</h4>
          <p><strong>التوصية:</strong> ${rec.action}</p>
          ${rec.metric ? `<p>${rec.metric}</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  renderInsulinImpact(data) {
    document.getElementById('insulinImpactContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${data.avgDoseResponse}</div>
          <div class="stat-label">الانخفاض لكل وحدة</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${data.totalAnalyzed}</div>
          <div class="stat-label">الجرعات المحللة</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${data.overallControl.replace('_', ' ')}</div>
          <div class="stat-label">حالة التحكم</div>
        </div>
      </div>

      ${data.recommendations.map(rec => `
        <div class="risk-flag ${rec.type}" style="margin-top:16px;">
          <div class="risk-flag-content">
            <h4>${rec.message}</h4>
            <p><strong>التوصية:</strong> ${rec.action}</p>
            ${rec.metric ? `<p>${rec.metric}</p>` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }
}

let analyticsManager;
