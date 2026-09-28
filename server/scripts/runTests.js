// Automated test runner for the backend e2e suite.
// - Starts the API on a separate test database (weaveconnect_test) so your
//   development data is never touched.
// - Waits until the server is up, runs the e2e suite in _test-e2e.js,
//   then shuts the server down and exits with the right status code.
const { spawn } = require('node:child_process');
const path = require('node:path');

const TEST_PORT = Number(process.env.TEST_PORT) || 5050;
const TEST_DB = process.env.TEST_DB || 'mongodb://localhost:27017/weaveconnect_test';
const HEALTH_URL = `http://localhost:${TEST_PORT}/api/health`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet — keep polling
    }
    await delay(400);
  }
  throw new Error(`Server did not become ready at ${url}`);
}

(async () => {
  console.log(`[test] starting API on port ${TEST_PORT} with DB ${TEST_DB}...`);
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      MONGODB_URI: TEST_DB,
    },
    stdio: 'inherit',
  });

  let exitCode = 1;
  try {
    await waitForServer(HEALTH_URL);
    console.log('[test] server ready, running e2e suite...\n');

    process.env.TEST_BASE = `http://localhost:${TEST_PORT}`;
    process.env.TEST_DB = TEST_DB;

    const runTests = require('../_test-e2e');
    const { pass, fail } = await runTests({});
    console.log(`[test] suite finished: ${pass} passed, ${fail} failed`);
    exitCode = fail > 0 ? 1 : 0;
  } catch (err) {
    console.error('[test] FAILED:', err.message);
  } finally {
    console.log('[test] shutting down API...');
    server.kill('SIGTERM');
  }

  // Give the child a moment to exit gracefully, then exit with our code.
  setTimeout(() => process.exit(exitCode), 1000);
})();