import { Injectable } from '@nestjs/common';
import { PackagingNotFoundError } from '../domain/packaging.js';
import { PackagingRepository } from '../domain/packaging.repository.js';

@Injectable()
export class DeletePackaging {
  constructor(private readonly packagings: PackagingRepository) {}

  async execute(associationId: string, productId: string, packagingId: string): Promise<void> {
    if (!(await this.packagings.deleteOwn(associationId, productId, packagingId))) {
      throw new PackagingNotFoundError();
    }
  }
}
