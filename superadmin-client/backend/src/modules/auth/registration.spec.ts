import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerRegisterDto } from './dto/auth.dto';

describe('five field customer registration', () => {
  const fields = { username: 'App_User', email: ' Customer@Example.com ', firstName: 'App', lastName: 'User', password: 'Example123!' };
  it('accepts exactly the five fields and normalizes username/email', async () => {
    const dto = plainToInstance(CustomerRegisterDto, fields);
    expect(await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).toEqual([]);
    expect(dto.username).toBe('app_user');
    expect(dto.email).toBe('customer@example.com');
  });
  it('accepts only dealer/private seller categories, without accepting an authorization role', async () => {
    expect(await validate(plainToInstance(CustomerRegisterDto, { ...fields, accountType: 'DEALER' }))).toEqual([]);
    expect((await validate(plainToInstance(CustomerRegisterDto, { ...fields, accountType: 'ADMIN' }))).length).toBeGreaterThan(0);
  });
  it('requires username and rejects fields outside the registration contract', async () => {
    expect((await validate(plainToInstance(CustomerRegisterDto, { ...fields, username: undefined }))).length).toBeGreaterThan(0);
    expect((await validate(plainToInstance(CustomerRegisterDto, { ...fields, phone: '+27821234567' }), { whitelist: true, forbidNonWhitelisted: true })).length).toBeGreaterThan(0);
  });
});
