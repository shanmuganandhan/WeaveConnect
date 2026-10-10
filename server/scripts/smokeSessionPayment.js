// Manual smoke test for the session (refresh/logout) and payment endpoints.
// Spawns the API on its own port against a throwaway database, runs a few
// checks, then shuts everything down. Run with:  node scripts/smokeSessionPayment.js
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = Number(process.env.SMOKE_PORT) || 5077;
const DB = 'mongodb://localhost:27017/weaveconnect_smoke';
const BASE = `http://localhost:${PORT}/api`;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
let fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label} ${extra}`);
  }
};

async function req(method, url, { body, token } = {}) {
  try {
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } catch (err) {
    return { status: 0, json: null, err: err.message };
  }
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {}
    await delay(400);
  }
  throw new Error('server did not start');
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), MONGODB_URI: DB },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write(`[api] ${d}`));
  server.stderr.on('data', (d) => process.stdout.write(`[api] ${d}`));

  try {
    await waitForServer();

    const email = `smoke_${Date.now()}@example.com`;
    const password = 'Sup3rSecret!pass';

    // --- register ---------------------------------------------------------
    const reg = await req('POST', '/auth/register', {
      body: { name: 'Smoke Tester', email, password, role: 'buyer' },
    });
    check('register returns 201', reg.status === 201, `got ${reg.status}`);
    const token1 = reg.json?.data?.token;
    const refresh1 = reg.json?.data?.refreshToken;
    check('register returns a token', !!token1);
    check('register returns a refreshToken', !!refresh1);

    // --- refresh rotates --------------------------------------------------
    const ref1 = await req('POST', '/auth/refresh', { body: { refreshToken: refresh1 } });
    check('refresh returns 200', ref1.status === 200, `got ${ref1.status}`);
    const refresh2 = ref1.json?.data?.refreshToken;
    const token2 = ref1.json?.data?.token;
    check('refresh returns a new refreshToken', !!refresh2 && refresh2 !== refresh1);

    const refOld = await req('POST', '/auth/refresh', { body: { refreshToken: refresh1 } });
    check('old refresh token is rejected after rotation', refOld.status >= 400, `got ${refOld.status}`);

    // --- payment endpoints without gateway keys ---------------------------
    const pay = await req('POST', '/payment/create-order', {
      token: token2,
      body: { items: [{ productId: '000000000000000000000000', quantity: 1 }] },
    });
    check(
      'payment create-order answers 503 when gateway is not configured',
      pay.status === 503,
      `got ${pay.status} ${JSON.stringify(pay.json)}`
    );

    // --- buyer cannot cancel a stranger's / unknown order -----------------
    const cancel = await req('PATCH', '/orders/000000000000000000000000/cancel', { token: token2 });
    check('cancel unknown order answers 404', cancel.status === 404, `got ${cancel.status}`);

    // --- logout revokes both token kinds ----------------------------------
    const out = await req('POST', '/auth/logout', { body: { refreshToken: refresh2 } });
    check('logout returns 200', out.status === 200, `got ${out.status}`);

    const refDead = await req('POST', '/auth/refresh', { body: { refreshToken: refresh2 } });
    check('refresh token is dead after logout', refDead.status >= 400, `got ${refDead.status}`);

    // Access tokens are bound to the session record, so a device logout must
    // kill them too rather than waiting for the 15-minute expiry.
    const dead = await req('GET', '/orders', { token: token2 });
    check('access token is revoked by logout', dead.status === 401, `got ${dead.status}`);

    // --- forgot password without SMTP ------------------------------------
    const forgot = await req('POST', '/auth/forgot-password', { body: { email } });
    check(
      'forgot-password answers 503 when SMTP is not configured',
      forgot.status === 503,
      `got ${forgot.status} ${JSON.stringify(forgot.json)}`
    );

    // --- validation -------------------------------------------------------
    const bad = await req('POST', '/auth/login', { body: { email, password: '' } });
    check('login with empty password answers 400', bad.status === 400, `got ${bad.status}`);
  } catch (err) {
    console.log('FATAL', err.message);
    fail++;
  } finally {
    server.kill('SIGTERM');
  }

  console.log(`\nSMOKE RESULT: ${pass} passed, ${fail} failed`);
  setTimeout(() => process.exit(fail ? 1 : 0), 500);
})();
