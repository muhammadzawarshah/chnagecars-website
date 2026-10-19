import { publicVehicleFields, withAvailability } from './vehicle.presenter';

describe('public vehicle fields', () => {
  it('uses this vehicle’s feed values and never exposes the raw feed', () => {
    const result = withAvailability({ status: 'PUBLISHED', price: 100, specialPrice: null, isSpecial: false,
      stockNumber: 'ST-1', description: 'Description', sourceData: { vehicle_id: '123', vin: 'PRIVATE', dealertrade: {
        vehicle_id: 456, no_gears: 7, turbo_supercharged: 'T', body_type_id: 29, driven_wheels_id: 4,
        front_tyre_size: '195/60 R16', rear_tyre_size: '195/60 R16', fuel_tank_size: '37.0', mmcode: '04035331', additional_information: 'Dealer notes',
      } }, variant: { specification: { gears: 6, extra: { sourceVehicleIds: [999] } } } });
    expect(result).toMatchObject({ sourceVehicleId: '456', stockNumber: 'ST-1', gears: 7, turboSupercharged: 'TURBO', bodyTypeId: '29', drivetrainSourceId: '4', fuelTankLitres: 37, mmcode: '04035331', additionalInformation: 'Dealer notes' });
    expect(result).not.toHaveProperty('sourceData');
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
  it('falls back to existing specifications without inventing a source vehicle ID', () => {
    expect(publicVehicleFields({ variant: { specification: { gears: 6, fuelTankLitres: 58, extra: { mmcode: '00123', front_tyre_size: 'x', sourceVehicleIds: [123] } } } })).toMatchObject({ gears: 6, fuelTankLitres: 58, mmcode: '00123', frontTyreSize: 'x', sourceVehicleId: null, turboSupercharged: null });
  });
  it.each([['S', 'SUPERCHARGED'], ['N', 'NONE'], ['no', 'NONE'], ['Yes', 'FORCED_INDUCTION'], ['', null], ['N/A', null]])('normalizes turbo value %s', (raw, expected) => {
    expect(publicVehicleFields({ sourceData: { dealertrade: { turbo_supercharged: raw } } }).turboSupercharged).toBe(expected);
  });
  it('returns null for unavailable or invalid specifications', () => {
    expect(publicVehicleFields({ sourceData: { dealertrade: { no_gears: 0, fuel_tank_size: 'invalid' } } })).toMatchObject({ gears: null, fuelTankLitres: null, mmcode: null, sourceVehicleId: null });
  });
});
