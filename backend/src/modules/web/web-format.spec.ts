import { Province } from '../../generated/prisma/client';
import { cityFromAddress, provinceFromPlace } from './sa-places';
import { parseWebCarSearch } from './web-cars.service';
import { mileageFromRange } from './web-forms.service';
import { bodyTypeLabel, bodyTypeSlugs, driveLabel, fromWebId, fuelsFromLabel, hoursRows, localPhone, provinceFromName, toWebId } from './web-format';

describe('website adapter vocabulary', () => {
  it('car ids have no hyphens and round-trip to the UUID', () => {
    const uuid = '01a114a9-f64d-76a5-9303-86308409a4b6';
    const id = toWebId(uuid);
    expect(id).toBe('01a114a9f64d76a5930386308409a4b6');
    // The website reads the id as the text after the last hyphen of "<title>-<id>".
    const slug = `2009-toyota-land-cruiser-${id}`;
    expect(fromWebId(slug.slice(slug.lastIndexOf('-') + 1))).toBe(uuid);
    expect(fromWebId(uuid)).toBe(uuid);
    expect(fromWebId('101')).toBeNull();
    expect(fromWebId('zz'.repeat(16))).toBeNull();
  });

  it('maps provinces, fuels, drive and body types both ways', () => {
    expect(provinceFromName('KwaZulu-Natal')).toBe(Province.KWAZULU_NATAL);
    expect(provinceFromName('kwazulu natal')).toBe(Province.KWAZULU_NATAL);
    expect(provinceFromName('WESTERN_CAPE')).toBe(Province.WESTERN_CAPE);
    expect(provinceFromName('Atlantis')).toBeUndefined();
    expect(fuelsFromLabel('Hybrid')).toEqual(['HYBRID', 'PLUGIN_HYBRID']);
    expect(driveLabel('AWD')).toBe('4X4');
    expect(driveLabel(null)).toBe('4X2');
    expect(bodyTypeSlugs('Extended Cab')).toEqual(['king-cabs', 'super-cabs']);
    expect(bodyTypeLabel(['electric-vehicles', 'crossovers'])).toBe('SUV');
    expect(bodyTypeLabel([])).toBe('Other');
  });

  it('formats branch hours like the website and merges equal days', () => {
    const rows = hoursRows([
      { day: 'Mon', open: '08:00', close: '17:00' },
      { day: 'Tue', open: '08:00', close: '17:00' },
      { day: 'Fri', open: '08:00', close: '17:00' },
      { day: 'Sat', open: '08:30', close: '13:00' },
      { day: 'Sun', closed: true },
      { day: 'PublicHoliday', closed: true },
    ]);
    expect(rows).toEqual([
      { day: 'Monday to Friday', time: '08.00 – 17.00' },
      { day: 'Saturday', time: '08.30 – 13.00' },
      { day: 'Sunday', time: 'Closed' },
      { day: 'Public holidays', time: 'Closed' },
    ]);
    expect(hoursRows(null)).toBeUndefined();
  });

  it('gives phone numbers in the local format the WhatsApp links expect', () => {
    expect(localPhone('+27 82 000 0000')).toBe('082 000 0000');
    expect(localPhone('27820000000')).toBe('082 000 0000');
    expect(localPhone('011 555 0101')).toBe('011 555 0101');
    expect(localPhone(null)).toBe('');
  });

  it('parses the website search query like the website does', () => {
    expect(parseWebCarSearch({ minPrice: '900000', maxPrice: '100000', sort: 'bogus', collection: 'exotics', page: '-2', q: '  bmw ' })).toEqual({
      minPrice: 100000,
      maxPrice: 900000,
      collection: 'exotics',
      q: 'bmw',
    });
    expect(parseWebCarSearch({ collection: 'unknown', make: ['toyota', 'bmw'] })).toEqual({ make: 'toyota' });
  });
});

describe('places', () => {
  it('finds the province of common towns and suburbs', () => {
    expect(provinceFromPlace('Durbanville')).toBe(Province.WESTERN_CAPE);
    expect(provinceFromPlace('12 Main Road, Sandton')).toBe(Province.GAUTENG);
    expect(provinceFromPlace('Pretoria East')).toBe(Province.GAUTENG);
    expect(provinceFromPlace('Gqeberha')).toBe(Province.EASTERN_CAPE);
    expect(provinceFromPlace('Somewhere, Limpopo')).toBe(Province.LIMPOPO);
    expect(provinceFromPlace('Zzyzx Road')).toBeUndefined();
  });

  it('takes the city from a dealer address', () => {
    expect(cityFromAddress('5 Lagoon Drive, Umhlanga, KwaZulu-Natal')).toBe('Umhlanga');
    expect(cityFromAddress('Sandton')).toBe('Sandton');
  });

  it('turns a mileage band into one number', () => {
    expect(mileageFromRange('50,001 - 55,000 km')).toBe(52501);
    expect(mileageFromRange('400,001 km PLUS')).toBe(400001);
    expect(mileageFromRange('none')).toBeUndefined();
  });
});
