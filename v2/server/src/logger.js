// ── Structured Logger (pino) ──────────────────────────────────────
// JSON-based structured logging with levels, context, and sensitive
// data masking. Replaces all console.log/warn/error calls.
// ──────────────────────────────────────────────────────────────────

import pino from 'pino';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

const isDev = process.env.NODE_ENV !== 'production';

// ── Sensitive data patterns to redact ──
const SENSITIVE_KEYS = ['password', 'password_hash', 'token', 'refreshToken', 'accessToken',
  'authorization', 'bot_token', 'telegram_bot_token', 'cookie', 'secret', 'encryption_key'];

// ── Create pino logger ──
const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', ignore: 'pid,hostname' } }
  : {
      targets: [
        // stdout as JSON for production (consumed by log aggregators)
        { target: 'pino/file', options: { destination: 1 }, level: 'info' },
        // application log file
        { target: 'pino/file', options: { destination: join(logsDir, 'application.log') }, level: 'info' },
        // error log file
        { target: 'pino/file', options: { destination: join(logsDir, 'error.log') }, level: 'error' },
      ],
    };

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: SENSITIVE_KEYS.map(k => `*.${k}`).concat(SENSITIVE_KEYS.map(k => k)),
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.socket?.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  transport,
});

// ── Module-scoped child loggers ──
export function createLogger(module) {
  return logger.child({ module });
}

export default logger;
