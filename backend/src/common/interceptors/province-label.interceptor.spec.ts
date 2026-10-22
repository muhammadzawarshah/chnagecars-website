import { labelProvinces } from './province-label.interceptor';

describe('labelProvinces', () => {
  it('turns legacy enum keys into province names at any depth', () => {
    const body = {
      data: [{ province: 'GAUTENG', dealer: { name: 'X' }, branch: { province: 'KWAZULU_NATAL' } }],
      province: [{ value: 'WESTERN_CAPE', count: 3 }],
      eligibleProvinces: ['FREE_STATE', 'North West'],
    };
    labelProvinces(body);
    expect(body).toEqual({
      data: [{ province: 'Gauteng', dealer: { name: 'X' }, branch: { province: 'KwaZulu-Natal' } }],
      province: [{ value: 'Western Cape', count: 3 }],
      eligibleProvinces: ['Free State', 'North West'],
    });
  });

  it('leaves names, nulls, other fields and non-JSON values alone', () => {
    const date = new Date(0);
    const body = { province: 'Western Cape', title: 'GAUTENG', other: null, at: date, list: [{ province: null }] };
    labelProvinces(body);
    expect(body).toEqual({ province: 'Western Cape', title: 'GAUTENG', other: null, at: date, list: [{ province: null }] });
    expect(() => labelProvinces(Buffer.from('x'))).not.toThrow();
  });
});
