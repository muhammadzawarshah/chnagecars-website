/** The only branded customer app currently enabled. These are the existing app's four branches. */
export const GROUP1_APP_ID = 'group1';
export const GROUP1_APP_NAME = 'Group1';
export const GROUP1_DEALER_IDS = ['3490', '3491', '3493', '3496'] as const;

export function isGroup1Scope(ids: readonly string[]) {
  const unique = [...new Set(ids)].sort();
  return unique.length === GROUP1_DEALER_IDS.length && unique.every((id, i) => id === GROUP1_DEALER_IDS[i]);
}
