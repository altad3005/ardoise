import { Module } from '@nestjs/common';
import { RegisterUser } from './application/register-user.use-case.js';
import { PasswordHasher } from './domain/password-hasher.js';
import { UserRepository } from './domain/user.repository.js';
import { UsersController } from './http/users.controller.js';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';

@Module({
  controllers: [UsersController],
  providers: [
    RegisterUser,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
})
export class UsersModule {}
