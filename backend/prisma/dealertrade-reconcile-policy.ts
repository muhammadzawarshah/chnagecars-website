import { isDeepStrictEqual } from 'node:util';
export type FeedRow=Record<string,any>;
export function empty(value:any):boolean{
  return value===undefined||value===null||(typeof value==='string'&&!value.trim())||(Array.isArray(value)&&!value.length)||(typeof value==='object'&&!Array.isArray(value)&&!Object.keys(value).length);
}
/** Preserve old values for blank input, including nested fields; zero and false win. */
export function mergeProvided(previous:any,incoming:any):any{
  if(empty(incoming))return previous===undefined?incoming:previous;
  if(Array.isArray(incoming))return structuredClone(incoming);
  if(typeof incoming==='object'){
    const result=previous&&typeof previous==='object'&&!Array.isArray(previous)?structuredClone(previous):{};
    for(const [key,value]of Object.entries(incoming))result[key]=mergeProvided(result[key],value);
    return result;
  }
  return incoming;
}
export function changedFields(before:FeedRow,patch:FeedRow):FeedRow{
  return Object.fromEntries(Object.entries(patch).filter(([key,value])=>!isDeepStrictEqual(before[key],value)));
}
export const integer=(v:any,min=0):number|undefined=>!empty(v)&&typeof v!=='boolean'&&Number.isSafeInteger(Number(v))&&Number(v)>=min?Number(v):undefined;

/** Current stock API uses model_year and numeric fuel IDs. Blank values preserve existing columns. */
export function sourceVehicleAttributes(row: FeedRow): FeedRow {
  const patch: FeedRow = {};
  const year = integer(empty(row.model_year) ? row.year : row.model_year, 1900);
  if (year !== undefined && year <= 2100) patch.year = year;
  if (!empty(row.fuel_type_id)) {
    const fuels: Record<string, string> = { '1': 'PETROL', '2': 'DIESEL', '3': 'ELECTRIC', '4': 'HYBRID' };
    patch.fuelType = fuels[String(row.fuel_type_id)] ?? 'OTHER';
  }
  return patch;
}

/** Preserve feed-level metadata separately from individual vehicle payloads. */
export function stockMetadata(capture: FeedRow): FeedRow | undefined {
  if (!capture.stockMeta || typeof capture.stockMeta !== 'object' || Array.isArray(capture.stockMeta)) return undefined;
  return { meta: capture.stockMeta, total: capture.finalGlobalTotal ?? null };
}
