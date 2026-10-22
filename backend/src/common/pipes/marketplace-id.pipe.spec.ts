import { validateSync } from 'class-validator';
import { IsMarketplaceId, ParseMarketplaceIdPipe } from './marketplace-id.pipe';

class Input {
  @IsMarketplaceId() vehicleId: string;
}
describe('actual DealerTrade primary key validation', () => {
  it.each(['1556517', '3095', '11111111-1111-4111-a111-111111111111'])('accepts source IDs and legacy/native UUID %s', id => {
    expect(new ParseMarketplaceIdPipe().transform(id)).toBe(id);
    const input = Object.assign(new Input(), { vehicleId: id });
    expect(validateSync(input)).toHaveLength(0);
  });
  it.each(['', '-1', '1.5', '123 OR TRUE', 'not-an-id'])('rejects invalid ID %s', id => {
    expect(() => new ParseMarketplaceIdPipe().transform(id)).toThrow();
    expect(validateSync(Object.assign(new Input(), { vehicleId: id })).length).toBeGreaterThan(0);
  });
});
