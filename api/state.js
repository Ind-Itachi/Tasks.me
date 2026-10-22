const { isAuthorized } = require('../lib/session');

const STATE_PATH = 'tasksme/workspace.json';

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Sign in to access this workspace.' });
  if (req.method === 'PUT' && !sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request blocked.' });

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ error: 'Connect a Vercel Blob store and enable BLOB_READ_WRITE_TOKEN for this deployment.' });
    }
    const { get, put } = await import('@vercel/blob');
    if (req.method === 'GET') {
      const blob = await get(STATE_PATH, { access: 'private', useCache: false });
      if (!blob || blob.statusCode !== 200 || !blob.stream) return res.status(200).json({ state: null });
      const state = await new Response(blob.stream).json();
      return res.status(200).json({ state });
    }

    const state = req.body;
    if (!state || typeof state !== 'object' || !state.board || !Array.isArray(state.board.tasks) || !Array.isArray(state.editors) || !Array.isArray(state.projects) || typeof state.studioName !== 'string') {
      return res.status(400).json({ error: 'Workspace data is invalid.' });
    }
    const serialized = JSON.stringify(state);
    if (Buffer.byteLength(serialized, 'utf8') > 900_000) return res.status(413).json({ error: 'Workspace data is too large to save.' });
    await put(STATE_PATH, serialized, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return res.status(200).json({ saved: true });
  } catch (error) {
    console.error('Workspace storage error:', error);
    return res.status(500).json({ error: error.message || 'Could not access workspace storage.' });
  }
};
