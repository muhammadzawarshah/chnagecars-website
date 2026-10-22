import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Province } from '../utils/province';

const LABELS: Record<string, string> = Province;

/** "GAUTENG" → "Gauteng"; anything else (already a name, null, other text) is returned as-is. */
const label = (value: unknown) => (typeof value === 'string' && LABELS[value]) || value;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

/**
 * Safety net so clients always receive province names ("Western Cape"), never enum keys
 * ("WESTERN_CAPE"), whatever the database or generated Prisma client returns. Rewrites
 * `province` / `provinces` / `eligibleProvinces` fields (strings, string arrays and facet
 * `{ value }` options) in place, at any depth of a JSON response.
 */
export function labelProvinces(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) labelProvinces(item);
    return;
  }
  if (!isPlainObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'province' || key === 'provinces' || key === 'eligibleProvinces') {
      if (typeof value === 'string') {
        node[key] = label(value);
        continue;
      }
      if (Array.isArray(value)) {
        node[key] = value.map((item) => {
          if (isPlainObject(item) && 'value' in item) item.value = label(item.value);
          return isPlainObject(item) ? item : label(item);
        });
        continue;
      }
    }
    if (typeof value === 'object' && value !== null) labelProvinces(value);
  }
}

@Injectable()
export class ProvinceLabelInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    return next.handle().pipe(
      map((body) => {
        labelProvinces(body);
        return body;
      }),
    );
  }
}
