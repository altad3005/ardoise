import { verify } from '@node-rs/argon2';
import { describe, expect, it } from 'vitest';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces an argon2id hash', async () => {
    const hash = await hasher.hash('correct horse battery');

    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('produces a hash that matches the original password', async () => {
    const hash = await hasher.hash('correct horse battery');

    expect(await verify(hash, 'correct horse battery')).toBe(true);
    expect(await verify(hash, 'another long password')).toBe(false);
  });
});
