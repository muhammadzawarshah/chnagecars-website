import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

describe('profile update', () => {
  it('normalizes email, accepts URL clearing and rejects invalid URLs and null email', async () => {
    const dto = plainToInstance(UpdateProfileDto, { email: ' Test@Example.com ', youtubeProfileUrl: 'https://youtube.com/@test', instagramProfileUrl: null });
    expect(await validate(dto)).toEqual([]);
    expect(dto.email).toBe('test@example.com');
    expect((await validate(plainToInstance(UpdateProfileDto, { email: null }))).length).toBeGreaterThan(0);
    expect((await validate(plainToInstance(UpdateProfileDto, { facebookProfileUrl: 'javascript:alert(1)' }))).length).toBeGreaterThan(0);
  });
  it('updates only current user fields and resets verification when email changes', async () => {
    const old = { id: 'u', email: 'old@example.com', youtubeProfileUrl: null };
    const user = { findUniqueOrThrow: jest.fn().mockResolvedValue(old), update: jest.fn().mockResolvedValue(old) };
    const service = new CustomersService({ user } as any, { record: jest.fn() } as any);
    await service.updateProfile('u', { email: 'new@example.com', youtubeProfileUrl: 'https://youtube.com/@test' });
    expect(user.update).toHaveBeenCalledWith({ where: { id: 'u' }, data: { email: 'new@example.com', youtubeProfileUrl: 'https://youtube.com/@test', emailVerifiedAt: null } });
    user.update.mockRejectedValue({ code: 'P2002' });
    await expect(service.updateProfile('u', { email: 'duplicate@example.com' })).rejects.toThrow('already registered');
  });
});
