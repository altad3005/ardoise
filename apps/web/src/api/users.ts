import { registeredUserSchema, type RegisteredUser, type Registration } from '@ardoise/types';
import { ApiError } from './api-error.ts';

export async function registerUser(registration: Registration): Promise<RegisteredUser> {
  const response = await fetch('/api/identity/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registration),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return registeredUserSchema.parse(await response.json());
}
