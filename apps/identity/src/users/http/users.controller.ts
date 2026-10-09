import { Body, ConflictException, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { registrationSchema, type RegisteredUser, type Registration } from '@ardoise/types';
import { RegisterUser } from '../application/register-user.use-case.js';
import { EmailAlreadyUsedError } from '../domain/user.js';

const REGISTRATIONS_PER_MINUTE = 5;
const ONE_MINUTE_IN_MS = 60_000;

@Controller('users')
export class UsersController {
  constructor(private readonly registerUser: RegisterUser) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: REGISTRATIONS_PER_MINUTE, ttl: ONE_MINUTE_IN_MS } })
  async register(
    @Body({ schema: registrationSchema }) registration: Registration,
  ): Promise<RegisteredUser> {
    try {
      const user = await this.registerUser.execute(registration);
      return { id: user.id, email: user.email, displayName: user.displayName };
    } catch (error) {
      if (error instanceof EmailAlreadyUsedError) {
        throw new ConflictException('An account already exists with this email');
      }
      throw error;
    }
  }
}
