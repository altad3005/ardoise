import type { User } from './user.js';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;

  abstract save(user: User): Promise<void>;
}
