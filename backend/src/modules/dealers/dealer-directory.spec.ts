import { DealersService } from './dealers.service';

const feed = [
  { dealerId: '3490', concierge: '1', groups: [{ id: 134, name: 'Group 1', logo: 'dealer_categories/241219/gpi-lg.png' }, { id: 178, name: 'Changan Dealer', logo: '' }] },
  { dealerId: '3491', concierge: '0', groups: [{ id: 134, name: 'Group 1', logo: null }] },
  { dealerId: '82', concierge: null, groups: [{ id: 82, name: 'Bikeshop', logo: null }] },
  { dealerId: '999', concierge: '1', groups: [] },
];

function setup() {
  const dealer = {
    findMany: jest.fn().mockImplementation(async ({ where }) => where
      ? [{ id: '3490', name: 'Group1 Cars Midrand', branches: [{ latitude: -25.97, longitude: 28.14 }] }]
      : []),
    count: jest.fn().mockResolvedValue(1),
  };
  const replica = { dealer, $queryRaw: jest.fn().mockResolvedValue(feed) };
  const identities = { refresh: jest.fn(), whatsappNumber: jest.fn().mockReturnValue(null) };
  const media = { url: (path: string) => `https://www.changecars.co.za/images/200/${path}` };
  const service = new DealersService({ replica } as any, {} as any, {} as any, {} as any, {} as any, {} as any, identities as any, media as any);
  return { service, dealer, replica };
}

const where = (dealer: { findMany: jest.Mock }) => JSON.stringify(dealer.findMany.mock.calls[0][0].where);

describe('public dealer directory filters', () => {
  it('returns DealerTrade groups, concierge and map coordinates with each dealer', async () => {
    const { service } = setup();
    const page = await service.listPublic({});
    expect(page.data[0]).toEqual(expect.objectContaining({
      conciergePartner: true, latitude: -25.97, longitude: 28.14,
      groups: [
        { id: '134', name: 'Group 1', slug: 'group-1', logoUrl: 'https://www.changecars.co.za/images/200/dealer_categories/241219/gpi-lg.png' },
        { id: '178', name: 'Changan Dealer', slug: 'changan-dealer', logoUrl: null },
      ],
    }));
    expect(page.data[0]).not.toHaveProperty('branches');
  });

  it('filters by group ID or slug, concierge, motorbikes, letter, make, model and on-road costs', async () => {
    const byGroup = setup();
    await byGroup.service.listPublic({ group: '134' });
    expect(where(byGroup.dealer)).toContain('"id":{"in":["3490","3491"]}');
    const bySlug = setup();
    await bySlug.service.listPublic({ group: 'Group-1' });
    expect(where(bySlug.dealer)).toContain('"id":{"in":["3490","3491"]}');

    const flags = setup();
    await flags.service.listPublic({ concierge: true, motorbike: true, onRoadCosts: true, letter: 'g', make: 'Ford', model: 'abarth:124' });
    const filter = where(flags.dealer);
    expect(filter).toContain('"id":{"in":["3490","999"]}');
    expect(filter).toContain('"id":{"in":["82"]}');
    expect(filter).toContain('"slug":"motorbikes"');
    expect(filter).toContain('"onRoadCostsIncluded":true');
    expect(filter).toContain('"name":{"startsWith":"g","mode":"insensitive"}');
    expect(filter).toContain('"slug":{"in":["ford"]}');
    expect(filter).toContain('"make":{"slug":"abarth"},"model":{"slug":"124"}');
  });

  it('lists All, Non-Franchised Dealers and each group with directory dealer counts', async () => {
    const { service, dealer } = setup();
    dealer.findMany.mockResolvedValue([{ id: '3490' }, { id: '3491' }, { id: '555' }]);
    const result = await service.groups();
    expect(result.total).toBe(3);
    expect(result.groups.map(group => [group.name, group.dealerCount])).toEqual([['Non-Franchised Dealers', 1], ['Changan Dealer', 1], ['Group 1', 2]]);
    expect(JSON.stringify(dealer.findMany.mock.calls[0][0].where)).toContain('"vehicles":{"some"');
  });

  it('lists only dealers with cars on sale and shows their stock count', async () => {
    const { service, dealer } = setup();
    dealer.findMany.mockResolvedValue([{ id: '3490', name: 'Group1 Cars Midrand', branches: [], _count: { vehicles: 74 } }]);
    const page = await service.listPublic({ group: 'non-franchised-dealers' });
    expect(page.data[0]).toEqual(expect.objectContaining({ activeListings: 74, latitude: null }));
    expect(page.data[0]).not.toHaveProperty('_count');
    const filter = where(dealer);
    expect(filter).toContain('"vehicles":{"some":{"status":{"in":["PUBLISHED","RESERVED"]}}}');
    expect(filter).toContain('"notIn":["3490","3491","82"]');
  });

  it('returns every located dealer for the map', async () => {
    const { service, dealer } = setup();
    dealer.findMany.mockResolvedValue([{ id: '3490', name: 'Group1 Cars Midrand', branches: [{ latitude: -25.97, longitude: 28.13 }] }]);
    expect(await service.mapPublic({ province: 'Gauteng' as any })).toEqual([{ id: '3490', name: 'Group1 Cars Midrand', latitude: -25.97, longitude: 28.13 }]);
    expect(dealer.findMany.mock.calls[0][0]).not.toHaveProperty('take');
  });

  it('counts the dealers selling each make and model', async () => {
    const { service, replica } = setup();
    Object.assign(replica, {
      vehicle: { groupBy: jest.fn().mockResolvedValue([
        { makeId: 'm1', modelId: 'x1', dealerId: 'd1' }, { makeId: 'm1', modelId: 'x1', dealerId: 'd2' }, { makeId: 'm1', modelId: 'x2', dealerId: 'd1' },
      ]) },
      make: { findMany: jest.fn().mockResolvedValue([{ id: 'm1', slug: 'alfa-romeo', name: 'Alfa Romeo' }]) },
      model: { findMany: jest.fn().mockResolvedValue([{ id: 'x1', slug: 'giulia', name: 'Giulia' }, { id: 'x2', slug: 'stelvio', name: 'Stelvio' }]) },
    });
    expect(await service.stockMakes()).toEqual([{ slug: 'alfa-romeo', name: 'Alfa Romeo', dealerCount: 2, models: [
      { slug: 'giulia', value: 'alfa-romeo:giulia', name: 'Giulia', dealerCount: 2 },
      { slug: 'stelvio', value: 'alfa-romeo:stelvio', name: 'Stelvio', dealerCount: 1 },
    ] }]);
  });
});
