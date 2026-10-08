import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../domain/password-hasher.js';
import { EmailAlreadyUsedError, type User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export interface RegisterUserCommand {
  email: string;
  displayName: string;
  password: string;
}

@Injectable()
export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const email = command.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyUsedError();
    }

    const user: User = {
      id: randomUUID(),
      email,
      displayName: command.displayName,
      passwordHash: await this.passwordHasher.hash(command.password),
      createdAt: new Date(),
    };
    await this.users.save(user);
    return user;
  }
}
