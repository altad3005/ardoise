import { beforeEach, describe, expect, it } from 'vitest';
import { EmailAlreadyUsedError } from '../domain/user.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository.js';
import { RegisterUser } from './register-user.use-case.js';

class FakePasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }
}

describe('RegisterUser', () => {
  let users: InMemoryUserRepository;
  let registerUser: RegisterUser;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    registerUser = new RegisterUser(users, new FakePasswordHasher());
  });

  it('stores the hashed password, never the plain one', async () => {
    const user = await registerUser.execute({
      email: 'alex@mail.com',
      displayName: 'Alex',
      password: 'correct horse battery',
    });

    const stored = await users.findByEmail('alex@mail.com');
    expect(user.passwordHash).toBe('hashed:correct horse battery');
    expect(Object.values(stored ?? {})).not.toContain('correct horse battery');
  });

  it('stores the email in lower case', async () => {
    const user = await registerUser.execute({
      email: 'Alex@Mail.COM',
      displayName: 'Alex',
      password: 'correct horse battery',
    });

    expect(user.email).toBe('alex@mail.com');
    expect(await users.findByEmail('alex@mail.com')).toEqual(user);
  });

  it('rejects an email that is already used, whatever its case', async () => {
    await registerUser.execute({
      email: 'alex@mail.com',
      displayName: 'Alex',
      password: 'correct horse battery',
    });

    await expect(
      registerUser.execute({
        email: 'ALEX@mail.com',
        displayName: 'Another Alex',
        password: 'another long password',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyUsedError);
  });

  it('generates an id and a creation date', async () => {
    const user = await registerUser.execute({
      email: 'alex@mail.com',
      displayName: 'Alex',
      password: 'correct horse battery',
    });

    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});
