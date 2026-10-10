import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

describe('profile update', () => {
  it('accepts social URL updates and clearing but rejects any email field', async () => {
    const options = { whitelist: true, forbidNonWhitelisted: true };
    expect(await validate(plainToInstance(UpdateProfileDto, { youtubeProfileUrl: 'https://youtube.com/@test', instagramProfileUrl: null }), options)).toEqual([]);
    for (const email of ['new@example.com', null]) {
      expect((await validate(plainToInstance(UpdateProfileDto, { email }), options)).some(error => error.property === 'email')).toBe(true);
    }
    expect((await validate(plainToInstance(UpdateProfileDto, { facebookProfileUrl: 'javascript:alert(1)' }), options)).length).toBeGreaterThan(0);
  });
  it('blocks email even for internal calls and still updates the remaining fields', async () => {
    const old = { id: 'u', email: 'old@example.com', youtubeProfileUrl: null };
    const user = { findUniqueOrThrow: jest.fn().mockResolvedValue(old), update: jest.fn().mockResolvedValue(old) };
    const service = new CustomersService({ user } as any, { record: jest.fn() } as any);
    await expect(service.updateProfile('u', { email: 'new@example.com' } as any)).rejects.toThrow('Email cannot be changed');
    expect(user.update).not.toHaveBeenCalled();
    await service.updateProfile('u', { firstName: 'Updated', youtubeProfileUrl: 'https://youtube.com/@test' });
    expect(user.update).toHaveBeenCalledWith({ where: { id: 'u' }, data: { firstName: 'Updated', youtubeProfileUrl: 'https://youtube.com/@test' } });
  });
});
