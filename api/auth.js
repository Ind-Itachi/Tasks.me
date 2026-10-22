const { isAuthorized, setSessionCookie, clearSessionCookie, passwordMatches } = require('../lib/session');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthorized(req) });
  }
  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.TASKSME_PASSWORD || !process.env.TASKSME_SESSION_SECRET) {
    return res.status(503).json({ error: 'Add TASKSME_PASSWORD and TASKSME_SESSION_SECRET in Vercel environment variables.' });
  }
  if (!passwordMatches(req.body && req.body.password)) {
    return res.status(401).json({ error: 'That password is not correct.' });
  }
  setSessionCookie(res);
  return res.status(200).json({ authenticated: true });
};
