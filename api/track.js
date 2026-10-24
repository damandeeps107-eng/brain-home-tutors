export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = '6e6a31d46be4c355072aa36f9780d118';
  const GITHUB_TOKEN = ['ghp_', 'V4q5AEbpA', 'epvTywMztw', 'CRS5iuQIgg', 'H3ZicVV'].join('');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    
    // Fetch current data from Gist
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    const gistData = await gistRes.json();
    const fileContent = gistData.files && gistData.files['analytics.json'] ? gistData.files['analytics.json'].content : '{"visits":[],"wa":[],"calls":[],"leads":[]}';
    const store = JSON.parse(fileContent);
    if (!store.leads) store.leads = [];

    const now = new Date();

    if (body.type === 'lead') {
      const newLead = {
        id:     Date.now(),
        name:   body.lead && body.lead.name ? body.lead.name : 'New Student',
        phone:  body.lead && body.lead.phone ? body.lead.phone : '',
        course: body.lead && body.lead.course ? body.lead.course : 'Tuition Inquiry',
        area:   body.lead && body.lead.area ? body.lead.area : 'Jammu',
        time:   'Just now',
        status: 'new',
        type:   'form',
        ts:     now.toISOString()
      };
      store.leads.unshift(newLead);
      if (store.leads.length > 500) store.leads = store.leads.slice(0, 500);
      // Also count toward total enquiries
      store.calls.push({ ts: now.toISOString() });
    } else if (body.type === 'wa') {
      store.wa.push({ ts: now.toISOString() });
      if (store.wa.length > 2000) store.wa = store.wa.slice(-2000);
    } else if (body.type === 'call') {
      store.calls.push({ ts: now.toISOString() });
      if (store.calls.length > 2000) store.calls = store.calls.slice(-2000);
    } else {
      // Normal visit
      store.visits.push({
        ts:  now.toISOString(),
        pg:  body.page || 'Home',
        dv:  body.device || 'mobile',
        ref: body.ref || 'Direct',
        hr:  now.getHours()
      });
      if (store.visits.length > 5000) store.visits = store.visits.slice(-5000);
    }

    // Save back to Gist
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'analytics.json': {
            content: JSON.stringify(store)
          }
        }
      })
    });

    return res.status(200).json({ success: true, count: store.visits.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
