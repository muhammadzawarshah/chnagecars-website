import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** DEALERTRADE_TOKEN, else the local token file; empty when neither is set. */
export function dealerTradeToken(): string {
  if (process.env.DEALERTRADE_TOKEN?.trim()) return process.env.DEALERTRADE_TOKEN.trim();
  try { return readFileSync(join(process.cwd(), '.local/dealertrade/token'), 'utf8').trim(); }
  catch { return ''; }
}
