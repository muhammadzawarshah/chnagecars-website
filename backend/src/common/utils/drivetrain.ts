/** Drivetrain values exactly as stored in the database and returned by the API. */
export const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4x2', '4x4'] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

const ALIASES: Record<string, Drivetrain> = {
  FWD: 'FWD',
  RWD: 'RWD',
  AWD: 'AWD',
  '4X2': '4x2',
  '4X4': '4x4',
  // Legacy enum keys still sent by older clients.
  FOUR_X_TWO: '4x2',
  FOUR_X_FOUR: '4x4',
};

/** "4x2", "4X2" or legacy "FOUR_X_TWO" → "4x2"; unknown input → undefined. */
export function toDrivetrain(raw: unknown): Drivetrain | undefined {
  if (typeof raw !== 'string') return undefined;
  return ALIASES[raw.trim().toUpperCase().replace(/[\s-]+/g, '_')];
}
