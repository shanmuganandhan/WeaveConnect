const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('./middleware/sanitize');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust exactly one reverse-proxy hop (Render) so req.ip resolves to the real
// client from X-Forwarded-For. express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR when this header arrives while
// 'trust proxy' is false. A value of 1 ignores client-supplied X-Forwarded-For
// spoofing beyond the single proxy Render adds.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(mongoSanitize);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
