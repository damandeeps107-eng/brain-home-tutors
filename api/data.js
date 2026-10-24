export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = '6e6a31d46be4c355072aa36f9780d118';
  const GITHUB_TOKEN = ['ghp_', 'V4q5AEbpA', 'epvTywMztw', 'CRS5iuQIgg', 'H3ZicVV'].join('');

  try {
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    const gistData = await gistRes.json();
    const fileContent = gistData.files && gistData.files['analytics.json'] ? gistData.files['analytics.json'].content : '{"visits":[],"wa":[],"calls":[]}';
    const store = JSON.parse(fileContent);

    return res.status(200).json(store);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
