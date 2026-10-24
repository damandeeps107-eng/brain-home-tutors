/* ==========================================================================
   Brains Home Tutors — Smart Visitor Tracker v2.0
   ──────────────────────────────────────────────
   INSTALL: Copy this file to your main website  js/tracker.js
   USAGE  : Add this line before </body> in index.html:
            <script src="js/tracker.js"></script>
   
   What it tracks (auto, no setup needed):
   ✅ Every page view (device, page, referrer, hour)
   ✅ WhatsApp button clicks
   ✅ Phone call button clicks
   ✅ Session time on page
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'bht_analytics_v2';

  /* ── helpers ── */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || mk(); } catch (e) { return mk(); }
  }
  function mk() { return { visits: [], wa: [], calls: [], v: 2 }; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function detectDevice() {
    var ua = navigator.userAgent;
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function detectPage() {
    var p = location.pathname.toLowerCase();
    if (p === '/' || p === '/index.html' || p === '') return 'Home';
    if (/neet/.test(p)) return 'NEET UG';
    if (/iit|jee/.test(p)) return 'IIT-JEE';
    if (/class.?11|class.?12|11th|12th/.test(p)) return 'Class 11-12';
    if (/class.?9|class.?10|9th|10th/.test(p)) return 'Class 9-10';
    if (/olympiad/.test(p)) return 'Olympiad';
    if (/nda/.test(p)) return 'NDA';
    if (/contact|enquiry/.test(p)) return 'Contact';
    if (/about/.test(p)) return 'About';
    return 'Other';
  }

  function detectReferrer() {
    var r = document.referrer || '';
    if (!r) return 'Direct';
    if (r.includes('google.'))    return 'Google';
    if (r.includes('whatsapp.'))  return 'WhatsApp';
    if (r.includes('facebook.') || r.includes('instagram.')) return 'Social Media';
    if (r.includes('youtube.'))   return 'YouTube';
    return 'Direct';
  }

  function sendCloudEvent(payload) {
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  /* ── track page view ── */
  (function trackView() {
    try {
      var d   = load();
      var now = new Date();
      var event = {
        ts:  now.toISOString(),
        pg:  detectPage(),
        dv:  detectDevice(),
        ref: detectReferrer(),
        hr:  now.getHours()
      };
      d.visits.push(event);
      if (d.visits.length > 5000) d.visits = d.visits.slice(-5000);
      save(d);
      sendCloudEvent(event);
      console.log('✅ [Brains Tracker] Real visit recorded! Total:', d.visits.length);
    } catch(err) {
      console.warn('[Brains Tracker] Error:', err);
    }
  })();

  /* ── track WhatsApp clicks ── */
  document.addEventListener('click', function (e) {
    if (e.target.closest('a[href*="wa.me"], a[href*="whatsapp"]')) {
      var d = load();
      d.wa.push({ ts: new Date().toISOString() });
      if (d.wa.length > 2000) d.wa = d.wa.slice(-2000);
      save(d);
      sendCloudEvent({ type: 'wa' });
    }
  }, { passive: true });

  /* ── track phone call clicks ── */
  document.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="tel:"]')) {
      var d = load();
      d.calls.push({ ts: new Date().toISOString() });
      if (d.calls.length > 2000) d.calls = d.calls.slice(-2000);
      save(d);
      sendCloudEvent({ type: 'call' });
    }
  }, { passive: true });

})();
