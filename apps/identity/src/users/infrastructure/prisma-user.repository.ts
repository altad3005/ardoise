import { Injectable } from '@nestjs/common';
import { Prisma } from '../../database/generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { EmailAlreadyUsedError, type User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async save(user: User): Promise<void> {
    try {
      await this.prisma.user.create({ data: user });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new EmailAlreadyUsedError();
      }
      throw error;
    }
  }
}
