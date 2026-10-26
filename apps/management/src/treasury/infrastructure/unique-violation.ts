import { Prisma } from '../../database/generated/prisma/client.js';

export async function rethrowUniqueViolation(
  operation: Promise<unknown>,
  toError: () => Error,
): Promise<void> {
  try {
    await operation;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw toError();
    }
    throw error;
  }
}
