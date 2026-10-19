import definitions from '../web/body-types.json';
import { expandBodyTypeSlugs, resolveBodyType } from './body-type-mapping';
import { publicVehicleFields } from './vehicle.presenter';

const cases: [number, string, string][] = [
  [3, 'C/B', 'Convertible'], [5, 'C/P', 'Coupé'], [9, 'D/C', 'Double Cab Bakkie'],
  [39, 'XCab', 'Extended Cab'], [53, 'Extended Cab', 'Extended Cab'],
  [12, 'h/b', 'Hatchback'], [14, 'Hatch', 'Hatchback'], [2, 'B/S', 'Minibus'],
  [10, 'D/P', 'Motorbike'], [16, 'O/F', 'Motorbike'], [19, 'R/D', 'Motorbike'], [23, 'S/P', 'Motorbike'],
  [15, 'MPV', 'MPV'], [17, 'P/V', 'Panel Van'], [22, 'S/D', 'Sedan'], [26, 'Sedan', 'Sedan'],
  [4, 'C/C', 'Single Cab Bakkie'], [11, 'D/S', 'Single Cab Bakkie'], [21, 'S/C', 'Single Cab Bakkie'],
  [24, 'S/W', 'Station Wagon'], [20, 'R/V', 'SUV'], [25, 'SAV', 'SUV'], [27, 'SUV', 'SUV'], [29, 'X/O', 'SUV'],
];
describe('canonical 15-name body type mapping', () => {
  it.each(cases)('maps ID %i code %s to %s consistently in detail and specifications', (id, code, label) => {
    const feed = { body_type_id: id, body_type: code };
    expect(resolveBodyType(feed)?.label).toBe(label);
    expect(resolveBodyType({ ...feed, body_type: null })?.label).toBe(label);
    const result = publicVehicleFields({ sourceData: { dealertrade: feed } });
    expect(result.bodyType).toBe(label); expect(result.technicalSpecifications.bodyType).toBe(label);
    expect(result.bodyTypeRaw).toBe(code); expect(result.bodyTypeId).toBe(String(id));
  });
  it.each(definitions)('accepts the exact canonical label $label', type => {
    expect(resolveBodyType({ body_type: type.label })?.label).toBe(type.label);
  });
  it('requires this listing’s verified URL category for ID 8', () => {
    expect(resolveBodyType({ body_type_id: 8, single_vehicle_url: 'new-or-used-cars-for-sale/gauteng/city/coupe/ferrari/458/123' })?.label).toBe('Coupé');
    expect(resolveBodyType({ body_type_id: 8 })).toBeNull();
  });
  it.each([13, 43, 999])('does not invent a category for unresolved ID %i', id => {
    expect(resolveBodyType({ body_type_id: id, body_type: id === 13 ? 'H/T' : 'F/C' })).toBeNull();
  });
  it('does not use categories from a different variant', () => {
    expect(publicVehicleFields({ sourceData: { dealertrade: { body_type_id: 43 } }, categories: [{ name: 'SUV' }] }).bodyType).toBeNull();
  });
});

it('preserves legacy single-cab and crossover filter aliases', () => {
  expect(expandBodyTypeSlugs(['bakkies'])).toEqual(['single-cabs', 'bakkies']);
  expect(expandBodyTypeSlugs(['crossovers'])).toEqual(['suvs', 'crossovers']);
  expect(expandBodyTypeSlugs(['classic-cars'])).toEqual(['classic-cars']);
  expect(resolveBodyType({body_type:'Coupe'})?.label).toBe('Coupé');
});

it.each(['single cab', 'SINGLE CAB BAKKIE', 'single-cab-bakkie', 'Single Cabe Bakie', '  Single   Cab Bakkie  '])('normalizes %s to the exact Title Case name', value => {
  expect(resolveBodyType({ body_type: value })?.label).toBe('Single Cab Bakkie');
});
