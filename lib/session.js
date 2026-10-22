const crypto = require('node:crypto');

const COOKIE = 'tasksme_session';
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function signature(value) {
  return crypto.createHmac('sha256', process.env.TASKSME_SESSION_SECRET || '').update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function tokenFor(expiry) {
  const value = String(expiry);
  return `${value}.${signature(value)}`;
}

function isAuthorized(req) {
  if (!process.env.TASKSME_SESSION_SECRET) return false;
  const cookie = req.headers.cookie || '';
  const raw = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const token = decodeURIComponent(raw.slice(COOKIE.length + 1));
  const [expiry, supplied] = token.split('.');
  if (!expiry || !supplied || Number(expiry) < Date.now()) return false;
  return safeEqual(signature(expiry), supplied);
}

function setSessionCookie(res) {
  const expiry = Date.now() + SESSION_SECONDS * 1000;
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(tokenFor(expiry))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

function passwordMatches(password) {
  const expected = process.env.TASKSME_PASSWORD || '';
  if (!expected || typeof password !== 'string') return false;
  return safeEqual(
    crypto.createHash('sha256').update(password).digest(),
    crypto.createHash('sha256').update(expected).digest()
  );
}

module.exports = { isAuthorized, setSessionCookie, clearSessionCookie, passwordMatches };
