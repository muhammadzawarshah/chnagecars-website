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

it('exposes only the selected dealer WhatsApp number and preserves its phone', () => {
  const input = { status: 'PUBLISHED' as const, price: 100, specialPrice: null, isSpecial: false,
    dealer: { id: '26', phone: '058 303 4155' },
    sourceData: { dealertradeDealer: { dealer_id: 26, whatsapp_number: ' +27614033321 ', lead_email_1: 'private@example.test' } } };
  const output = withAvailability(input);
  expect(output.dealer).toEqual({ id: '26', phone: '058 303 4155', whatsappNumber: '+27614033321' });
  expect(JSON.stringify(output)).not.toContain('private@example.test');
  expect(withAvailability({ ...input, sourceData: {} }).dealer).toEqual({ id: '26', phone: '058 303 4155', whatsappNumber: null });
});

it('returns this listing’s original path and full ChangeCars URL', () => {
  const singleVehicleUrl = 'new-or-used-cars-for-sale/mpumalanga/lydenburg/suv/suzuki-cars/xl6/1-5-gl/1521740';
  expect(publicVehicleFields({ sourceData: { dealertrade: { vehicle_id: 1521740, single_vehicle_url: singleVehicleUrl } } })).toMatchObject({ singleVehicleUrl, sourceUrl: `https://www.changecars.co.za/${singleVehicleUrl}` });
});

it.each(['https://other.example/new-or-used-cars-for-sale/1521740', 'javascript:alert(1)', 'new-or-used-cars-for-sale/wrong-vehicle/999'])('rejects an untrusted or different-vehicle source URL: %s', single_vehicle_url => {
  expect(publicVehicleFields({ sourceData: { dealertrade: { vehicle_id: 1521740, single_vehicle_url } } })).toMatchObject({ singleVehicleUrl: null, sourceUrl: null });
});

it('supports original motorbike listing URLs', () => {
  const path = 'new-or-used-motorbikes-for-sale/gauteng/ravenswood/motorbike/ktm/sx-f/1366882';
  expect(publicVehicleFields({ sourceData: { dealertrade: { vehicle_id: 1366882, single_vehicle_url: path } } })).toMatchObject({ singleVehicleUrl: path, sourceUrl: `https://www.changecars.co.za/${path}` });
});

it('keeps a source-verified variant identity without returning its old catalogue specifications', () => {
  const output = withAvailability({ status: 'PUBLISHED' as const, price: 100, specialPrice: null, isSpecial: false,
    variant: { id: 'stable-variant-id', name: 'Source variant', specification: { fuelTankLitres: 999, extra: { mmcode: 'OLD' } } },
    sourceData: { importPolicy: 'dealertrade-only', dealertrade: { vehicle_id: 123, fuel_tank_size: 0 } } });
  expect(output.variant).toEqual({ id: 'stable-variant-id', name: 'Source variant', specification: null });
  expect(output.technicalSpecifications.fuelTankLitres).toBeNull();
  expect(output.mmcode).toBeNull();
});
