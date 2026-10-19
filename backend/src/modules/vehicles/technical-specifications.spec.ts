import { publicVehicleFields } from './vehicle.presenter';

describe('listing technical specifications', () => {
  it('maps the selected listing rather than a conflicting variant', () => {
    const result = publicVehicleFields({ colour: 'Arkona White', doors: 3, sourceData: { dealertrade: {
      no_doors: 5, no_seats: 5, body_type: 'SUV', introduction_date: '2024-01-17', kilowatts: '110.0',
      cylinders: 4, engine_capacity: 1395, turbo_supercharged: 'T', fuel_tank_size: '50.0',
      front_tyre_size: '215/50 R18', rear_tyre_size: '215/50 R18', driven_wheels: '4X2',
    } }, variant: { specification: { fuelTankLitres: 99, extra: { front_tyre_size: 'wrong' } } } });
    expect(result.technicalSpecifications).toEqual({ doors: 5, seats: 5, bodyType: 'SUV', colour: 'Arkona White', introductionDate: '2024-01-17', powerKw: 110, cylinders: 4, engineCapacityCc: 1395, turboSupercharged: 'T', fuelTankLitres: 50, frontTyreSize: '215/50 R18', rearTyreSize: '215/50 R18', drivenWheels: '4X2' });
  });
  it('does not borrow tyres or introduction dates from a shared variant', () => {
    expect(publicVehicleFields({ variant: { specification: { extra: { front_tyre_size: 'wrong', introduction_date: '2024-01-17' } } } }).technicalSpecifications).toMatchObject({ introductionDate: null, frontTyreSize: null, rearTyreSize: null });
  });
});
