import { missingVehicleCoordinates } from './dealer-coordinates';
it('inherits a confirmed branch location for newly imported or partially missing vehicles', () => {
  const branch = { latitude: -33.8, longitude: 18.5 };
  expect(missingVehicleCoordinates(null, branch)).toEqual(branch);
  expect(missingVehicleCoordinates({ latitude: null, longitude: null }, branch)).toEqual(branch);
  expect(missingVehicleCoordinates({ latitude: -33.8, longitude: null }, branch)).toEqual(branch);
});
it('preserves a complete vehicle location and rejects invalid or missing branch points', () => {
  expect(missingVehicleCoordinates({ latitude: -26.1, longitude: 28.1 }, { latitude: -33.8, longitude: 18.5 })).toEqual({});
  for (const branch of [null, { latitude: null, longitude: 18 }, { latitude: 0, longitude: 0 }, { latitude: NaN, longitude: 18 }])
    expect(missingVehicleCoordinates(null, branch)).toEqual({});
});
