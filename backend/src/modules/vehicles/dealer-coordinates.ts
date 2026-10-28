/** New/missing vehicle locations inherit the confirmed location of their own branch. */
export function missingVehicleCoordinates(
  vehicle: { latitude?: number | null; longitude?: number | null } | null | undefined,
  branch: { latitude?: number | null; longitude?: number | null } | null | undefined,
): { latitude?: number; longitude?: number } {
  if (vehicle?.latitude != null && vehicle.longitude != null) return {};
  const latitude = branch?.latitude, longitude = branch?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -35.5 || latitude > -22 || longitude < 16 || longitude > 33.5) return {};
  return { latitude, longitude };
}
