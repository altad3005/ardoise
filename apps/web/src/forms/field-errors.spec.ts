import { describe, expect, it } from 'vitest';
import { toFieldErrors } from './field-errors.ts';

const messages = { email: 'Adresse e-mail invalide', password: 'Mot de passe trop court' };

describe('toFieldErrors', () => {
  it('maps each known field to its message', () => {
    expect(toFieldErrors([{ path: ['email'] }, { path: ['password'] }], messages)).toEqual(
      messages,
    );
  });

  it('ignores issues on unknown fields or without a path', () => {
    expect(toFieldErrors([{ path: ['nickname'] }, { path: [] }], messages)).toEqual({});
  });

  it('keeps one message when a field has several issues', () => {
    expect(toFieldErrors([{ path: ['email'] }, { path: ['email'] }], messages)).toEqual({
      email: 'Adresse e-mail invalide',
    });
  });
});
