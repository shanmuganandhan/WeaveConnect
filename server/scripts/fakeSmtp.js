// A tiny fake SMTP server used ONLY by the automated tests.
//
// Why this exists: the forgot-password feature emails a real OTP through
// Nodemailer, but the test suite must never send real email and must never
// need a real Gmail password. So during tests we point EMAIL_HOST/EMAIL_PORT
// at this local server, let Nodemailer "send" the email into it, and then read
// the OTP back out of the captured message.
//
// This is an ordinary SMTP conversation (the same protocol Gmail speaks), so
// the production Nodemailer code is completely unchanged and fully exercised.
// It lives in scripts/ and is never imported by src/.
const net = require('node:net');

// Starts the fake SMTP server and resolves once it is listening.
function startFakeSmtp({ port = 2525 } = {}) {
  // Every accepted email is kept here so tests can inspect it.
  const messages = [];

  const server = net.createServer((socket) => {
    let inData = false;      // are we reading the email body?
    let authStep = 0;        // 0 = none, 1 = waiting for username, 2 = waiting for password
    let buffer = '';         // partial data still waiting for a full line
    let current = { from: '', to: [], data: '' };

    socket.write('220 fake.smtp.test ESMTP ready\r\n');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      // SMTP is line based, so handle one complete line at a time.
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);
        const upper = line.toUpperCase();

        if (inData) {
          // A single dot on its own line means "end of the email body".
          if (line === '.') {
            inData = false;
            messages.push(current);
            current = { from: '', to: [], data: '' };
            socket.write('250 2.0.0 Ok: queued\r\n');
          } else {
            // ".." is an escaped literal dot, so undo the extra dot.
            current.data += (line.startsWith('..') ? line.slice(1) : line) + '\n';
          }
          continue;
        }

        if (upper.startsWith('AUTH')) {
          // Accept any login. Tests use a fake address, never real credentials.
          if (/AUTH\s+PLAIN/i.test(line)) {
            socket.write('235 2.7.0 Authentication successful\r\n');
          } else if (/AUTH\s+LOGIN\s*$/i.test(line)) {
            authStep = 1;
            socket.write('334 VXNlcm5hbWU6\r\n'); // base64("Username:")
          } else if (authStep === 1) {
            authStep = 2;
            socket.write('334 UGFzc3dvcmQ6\r\n'); // base64("Password:")
          } else if (authStep === 2) {
            authStep = 0;
            socket.write('235 2.7.0 Authentication successful\r\n');
          } else {
            socket.write('250 2.0.0 Ok\r\n');
          }
          continue;
        }

        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          // We do not advertise STARTTLS, so Nodemailer sends plain SMTP.
          socket.write('250-fake.smtp.test\r\n250-AUTH LOGIN PLAIN\r\n250-8BITMIME\r\n250 OK\r\n');
        } else if (upper.startsWith('MAIL FROM')) {
          current.from = line;
          socket.write('250 2.1.0 Ok\r\n');
        } else if (upper.startsWith('RCPT TO')) {
          current.to.push(line);
          socket.write('250 2.1.5 Ok\r\n');
        } else if (upper.startsWith('DATA')) {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (upper.startsWith('QUIT')) {
          socket.write('221 2.0.0 Bye\r\n');
          socket.end();
        } else {
          // Covers RSET, NOOP and anything else Nodemailer may send.
          socket.write('250 2.0.0 Ok\r\n');
        }
      }
    });

    // A client that disconnects early must not crash the test run.
    socket.on('error', () => {});
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve({
        port,
        getMessages: () => messages.slice(),
        getLastMessage: () => messages[messages.length - 1] || null,
        // Pulls the 6-digit OTP straight out of the received email body.
        getLastOtp: () => {
          const message = messages[messages.length - 1];
          if (!message) return null;
          const match = message.data.match(/\b(\d{6})\b/);
          return match ? match[1] : null;
        },
        clear: () => {
          messages.length = 0;
        },
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { startFakeSmtp };
