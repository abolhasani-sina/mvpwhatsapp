import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '..', 'logs');
const errorLogPath = join(logsDir, 'error.log');

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function buildHint(entry) {
  const msg = `${entry.msg || ''} ${entry?.err?.message || ''}`.toLowerCase();

  if (msg.includes('eaddrinuse') || msg.includes('address already in use')) {
    return 'Port already used. Stop other server process, then restart this server.';
  }
  if (msg.includes('token') && msg.includes('invalid')) {
    return 'Session/token issue. Ask user to log out and log in again.';
  }
  if (msg.includes('database') || msg.includes('sqlite')) {
    return 'Database issue. Check DB file access and whether migrations ran successfully.';
  }
  if (msg.includes('telegram')) {
    return 'Telegram integration issue. Verify bot token and chat/channel settings.';
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'Network/API issue. Check internet connection and third-party API availability.';
  }
  return 'Check the details and stack trace. If repeated, share this error item with support.';
}

function summarize(entry) {
  const message = entry.msg || entry?.err?.message || 'Unknown error';
  return {
    time: entry.time ? new Date(entry.time).toISOString() : new Date().toISOString(),
    level: entry.level,
    module: entry.module || 'unknown',
    message,
    technicalMessage: entry?.err?.message || null,
    stack: entry?.err?.stack || null,
    requestPath: entry.path || null,
    method: entry.method || null,
    errorId: entry.errorId || null,
    help: buildHint(entry),
  };
}

export function getReadableErrorLogs(limit = 30) {
  if (!existsSync(errorLogPath)) {
    return {
      exists: false,
      path: errorLogPath,
      total: 0,
      items: [],
      note: 'No error.log file yet. Trigger an error or run the app for a while.',
    };
  }

  const lines = readFileSync(errorLogPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseJsonLine)
    .filter(Boolean)
    .reverse()
    .slice(0, Math.max(1, Math.min(Number(limit) || 30, 200)));

  return {
    exists: true,
    path: errorLogPath,
    total: lines.length,
    items: lines.map(summarize),
  };
}

export function getRawErrorLogs(limit = 100) {
  if (!existsSync(errorLogPath)) return [];
  const lines = readFileSync(errorLogPath, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.slice(-Math.max(1, Math.min(Number(limit) || 100, 500)));
}
