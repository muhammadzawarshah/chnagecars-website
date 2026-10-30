import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { DealerTradeMediaService } from './dealertrade-media.service';

describe('DealerTrade logo copies', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dt-media-'));
  beforeAll(() => { process.env.DEALERTRADE_MEDIA_DIR = dir; process.env.API_PUBLIC_URL = 'https://api.example.test/'; });
  afterAll(() => { delete process.env.DEALERTRADE_MEDIA_DIR; delete process.env.API_PUBLIC_URL; jest.restoreAllMocks(); });

  it('downloads dealer and group logos once and points dealers at our copy', async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } }).png().toBuffer();
    const placeholder = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } }).png().toBuffer();
    // Like changecars.co.za, unknown files return a placeholder image with HTTP 200.
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (url) => /broken|missing-/.test(String(url))
      ? new Response(placeholder, { status: 200 }) : new Response(png, { status: 200 }));
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        { dealerId: '3490', image: 'dealers/250711/3490.png', groups: [{ id: 134, name: 'Group 1', logo: 'dealer_categories/241219/gpi-lg.png' }] },
        { dealerId: '3491', image: 'dealers/broken.png', groups: [{ id: 134, name: 'Group 1', logo: 'dealer_categories/241219/gpi-lg.png' }] },
        { dealerId: '9', image: null, groups: [] },
      ]),
      dealer: { updateMany },
    };
    const media = new DealerTradeMediaService(prisma as any);
    expect(media.url('dealers/250711/3490.png')).toBe('https://www.changecars.co.za/images/200/dealers/250711/3490.png');

    await media.mirror();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://www.changecars.co.za/images/200/dealers/250711/3490.png');
    expect(readdirSync(join(dir, 'dealertrade'))).toHaveLength(2);
    const ours = media.url('dealers/250711/3490.png');
    expect(ours).toMatch(/^https:\/\/api\.example\.test\/media\/dealertrade\/[a-f0-9]{64}\.png$/);
    expect(media.url('dealer_categories/241219/gpi-lg.png')).toMatch(/^https:\/\/api\.example\.test\/media\/dealertrade\//);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: '3490', OR: [{ logoUrl: null }, { logoUrl: { not: ours } }] }, data: { logoUrl: ours } });

    // Only the broken logo is tried again (plus the placeholder probe).
    await new DealerTradeMediaService(prisma as any).mirror();
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
