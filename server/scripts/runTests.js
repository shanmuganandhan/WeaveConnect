// Automated test runner for the backend e2e suite.
// - Starts the API on a separate test database (weaveconnect_test) so your
//   development data is never touched.
// - Waits until the server is up, runs the e2e suite in _test-e2e.js,
//   then shuts the server down and exits with the right status code.
const { spawn } = require('node:child_process');
const path = require('path');
const { startFakeSmtp } = require('./fakeSmtp');

const TEST_PORT = Number(process.env.TEST_PORT) || 5050;
const TEST_DB = process.env.TEST_DB || 'mongodb://localhost:27017/weaveconnect_test';
const TEST_SMTP_PORT = Number(process.env.TEST_SMTP_PORT) || 2525;
const HEALTH_URL = `http://localhost:${TEST_PORT}/api/health`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 45000) {
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

// The suite assumes an empty database (it counts products, checks exactly which
// sellers are pending, ...). Wipe the test database before every run so results
// do not depend on leftovers from a previous run.
async function resetTestDb() {
  const mongoose = require('mongoose');
  await mongoose.connect(TEST_DB);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

(async () => {
  console.log(`[test] starting API on port ${TEST_PORT} with DB ${TEST_DB}...`);
  await resetTestDb();

  // Nodemailer talks to this local fake SMTP server, so the forgot-password
  // OTP is produced and read back by the suite without any real mailbox.
  const smtp = await startFakeSmtp({ port: TEST_SMTP_PORT });

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      MONGODB_URI: TEST_DB,
      EMAIL_HOST: '127.0.0.1',
      EMAIL_PORT: String(TEST_SMTP_PORT),
      EMAIL_USER: 'test@fake.smtp',
      EMAIL_PASSWORD: 'not-a-real-password',
      EMAIL_FROM: 'noreply@fake.smtp',
      // Blanked on purpose, even if the developer's .env holds real Razorpay
      // test keys: the suite asserts the "no gateway configured" behaviour
      // and must never talk to the live API.
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      // A throwaway webhook secret so the suite can sign its own webhook
      // calls. Independent of the (blanked) API keys above.
      RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret',
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
    const { pass, fail } = await runTests({ smtp });
    console.log(`[test] suite finished: ${pass} passed, ${fail} failed`);
    exitCode = fail > 0 ? 1 : 0;
  } catch (err) {
    console.error('[test] FAILED:', err.message);
  } finally {
    console.log('[test] shutting down API...');
    server.kill('SIGTERM');
    await smtp.close();
  }

  // Give the child a moment to exit gracefully, then exit with our code.
  setTimeout(() => process.exit(exitCode), 1000);
})();