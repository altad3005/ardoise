export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
}

export class EmailAlreadyUsedError extends Error {
  constructor() {
    super('Email already used');
    this.name = 'EmailAlreadyUsedError';
  }
}
