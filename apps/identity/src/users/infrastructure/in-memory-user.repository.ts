import { EmailAlreadyUsedError, type User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export class InMemoryUserRepository extends UserRepository {
  private readonly users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async save(user: User): Promise<void> {
    if (this.users.some((existing) => existing.email === user.email)) {
      throw new EmailAlreadyUsedError();
    }
    this.users.push(user);
  }
}
