import { enumValues } from '../search/search.builder';
import { withAvailability } from './vehicle.presenter';

describe('public vehicle labels', () => {
  const vehicle = { status: 'PUBLISHED' as const, price: 100000, specialPrice: null, isSpecial: false, condition: 'USED', fuelType: 'PLUGIN_HYBRID', transmission: 'AUTOMATIC', province: 'Gauteng' };

  it('returns display names instead of enum codes', () => {
    expect(withAvailability(vehicle)).toMatchObject({
      condition: 'Used', fuelType: 'Plug-in Hybrid', transmission: 'Automatic', province: 'Gauteng',
      conditionLabel: 'Used', fuelTypeLabel: 'Plug-in Hybrid', transmissionLabel: 'Automatic',
    });
  });

  it('filters by display names as well as codes', () => {
    expect(enumValues('fuelType', 'Petrol,Plug-in Hybrid,LPG,DIESEL,bogus')).toEqual(['PETROL', 'PLUGIN_HYBRID', 'LPG', 'DIESEL']);
    expect(enumValues('transmission', 'automatic')).toEqual(['AUTOMATIC']);
    expect(enumValues('condition', 'Used,new')).toEqual(['USED', 'NEW']);
  });
});
