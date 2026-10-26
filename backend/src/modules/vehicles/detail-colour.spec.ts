import { detailColour, dealerTradeColourId } from './detail-colour';
import { withAvailability } from './vehicle.presenter';
import { snapshotPayload } from '../search/filter-snapshots';

describe('detail-only DealerTrade colours', () => {
  it('uses the feed paint name only for detail presentation, without mutating the stored colour', () => {
    const row = { status: 'PUBLISHED' as const, price: 100000, specialPrice: null, isSpecial: false,
      colour: 'White', sourceData: { dealertrade: { colour: ' FROZEN WHITE ' } } };
    const detail = withAvailability({ ...row, colour: detailColour(row) });
    expect(detail.colour).toBe('FROZEN WHITE');
    expect(detail.technicalSpecifications.colour).toBe('FROZEN WHITE');
    expect(withAvailability(row).colour).toBe('White');
    expect(row.colour).toBe('White');
    expect(detail).not.toHaveProperty('sourceData');
  });

  it.each([undefined, null, '', '  ', 'N/A', 'none', 'unknown', 123, {}])('falls back to stored colour when feed colour is %p', raw => {
    expect(detailColour({ colour: 'Silver', sourceData: { dealertrade: { colour: raw } } })).toBe('Silver');
  });

  it.each([0, -1, '', 'bad', 1.5, null, true, {}])('rejects invalid colour ID %p', raw => {
    expect(dealerTradeColourId({ sourceData: { dealertrade: { colour_id: raw } } })).toBeNull();
  });
  it('reads numeric source IDs', () => {
    expect(dealerTradeColourId({ sourceData: { dealertrade: { colour_id: 15 } } })).toBe(15);
    expect(dealerTradeColourId({ sourceData: { dealertrade: { colour_id: '8' } } })).toBe(8);
  });
  it('keeps missing colours null', () => { expect(detailColour({ colour: null })).toBeNull(); });

  it('leaves the manifest payload and revision input unchanged when source colours change', () => {
    const row = { id: '1', make: { slug: 'ford', name: 'Ford' }, model: { slug: 'ranger', name: 'Ranger' },
      variant: null, categories: [], dealer: { slug: 'dealer', name: 'Dealer' }, colour: 'White', condition: 'USED',
      status: 'PUBLISHED', price: 100000, isSpecial: false, specialPrice: null, province: 'Gauteng', city: 'Pretoria' };
    const before = snapshotPayload([{ ...row, sourceData: { dealertrade: { colour: 'Old supplier name' } } }]);
    const after = snapshotPayload([{ ...row, sourceData: { dealertrade: { colour: 'FROZEN WHITE' } } }]);
    expect(after).toEqual(before);
    expect(after.vehicles[0].color).toBe('white');
    expect(after.dictionaries.color.white).toBe('white');
  });
});
