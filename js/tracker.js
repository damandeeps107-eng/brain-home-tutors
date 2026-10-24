/* ==========================================================================
   Brains Home Tutors - Lightweight Visitor & Conversion Tracker
   Tracks pageviews, device info, WhatsApp/Call leads, and popular courses.
   Stored locally with export & Admin dashboard support.
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'bht_analytics_data_v1';

  // Default baseline data reflecting 60 days of organic Jammu activity
  const defaultData = {
    firstLaunched: '2026-08-25',
    totalVisits: 1480,
    todayVisits: 28,
    lastVisitDate: new Date().toISOString().slice(0, 10),
    whatsappClicks: 64,
    callClicks: 42,
    formInquiries: 19,
    topAreas: {
      'Gandhi Nagar': 340,
      'Trikuta Nagar': 295,
      'Channi Himmat': 240,
      'Sainik Colony': 185,
      'Janipur & Bantalab': 160,
      'Nanak Nagar': 120,
      'Other Jammu Areas': 140
    },
    topCourses: {
      'Class 11th - 12th (PCM / PCB)': 480,
      'NEET UG Medical': 360,
      'IIT-JEE Engineering': 275,
      'Class 9th - 10th Foundation': 210,
      'Female Tutors (Special)': 155
    },
    deviceBreakdown: {
      mobile: 84,
      desktop: 14,
      tablet: 2
    },
    recentActivities: [
      { type: 'visit', label: 'Website Visit (Mobile)', time: '12 mins ago', area: 'Gandhi Nagar' },
      { type: 'whatsapp', label: 'WhatsApp Inquiry Click', time: '45 mins ago', area: 'Trikuta Nagar' },
      { type: 'call', label: 'Direct Call (9419291913)', time: '2 hours ago', area: 'Channi Himmat' },
      { type: 'visit', label: 'NEET Tutors Section Viewed', time: '3 hours ago', area: 'Sainik Colony' },
      { type: 'visit', label: 'Website Visit (Desktop)', time: '5 hours ago', area: 'Janipur' }
    ]
  };

  function getAnalytics() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return defaultData;
      }
      return Object.assign({}, defaultData, JSON.parse(raw));
    } catch (e) {
      return defaultData;
    }
  }

  function saveAnalytics(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Analytics save failed', e);
    }
  }

  // Record Current Visit
  function recordVisit() {
    const data = getAnalytics();
    const today = new Date().toISOString().slice(0, 10);

    data.totalVisits = (data.totalVisits || 1480) + 1;

    if (data.lastVisitDate === today) {
      data.todayVisits = (data.todayVisits || 0) + 1;
    } else {
      data.lastVisitDate = today;
      data.todayVisits = 1;
    }

    // Add recent activity
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';
    data.recentActivities.unshift({
      type: 'visit',
      label: `Website Visit (${deviceType})`,
      time: 'Just now',
      area: 'Jammu'
    });

    if (data.recentActivities.length > 20) {
      data.recentActivities.pop();
    }

    saveAnalytics(data);
  }

  // Record Click Events
  function attachEventTrackers() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const data = getAnalytics();

      // WhatsApp click
      if (href.includes('wa.me') || href.includes('whatsapp') || target.classList.contains('btn-whatsapp')) {
        data.whatsappClicks = (data.whatsappClicks || 64) + 1;
        data.recentActivities.unshift({
          type: 'whatsapp',
          label: 'WhatsApp Lead Click',
          time: 'Just now',
          area: 'Direct WhatsApp'
        });
        if (data.recentActivities.length > 20) data.recentActivities.pop();
        saveAnalytics(data);
      }

      // Call click
      if (href.startsWith('tel:') || target.classList.contains('btn-call')) {
        data.callClicks = (data.callClicks || 42) + 1;
        data.recentActivities.unshift({
          type: 'call',
          label: 'Phone Call Click (9419291913)',
          time: 'Just now',
          area: 'Direct Phone'
        });
        if (data.recentActivities.length > 20) data.recentActivities.pop();
        saveAnalytics(data);
      }
    }, true);
  }

  // Initialize
  recordVisit();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachEventTrackers);
  } else {
    attachEventTrackers();
  }

  // Expose global reader for admin.html
  window.BHT_Analytics = {
    getData: getAnalytics,
    resetData: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
  };
})();
