import { Injectable } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { PasswordHasher } from '../domain/password-hasher.js';

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password);
  }
}
