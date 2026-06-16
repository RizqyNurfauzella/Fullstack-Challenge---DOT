import type { Request } from 'express';
import type { User } from '../entities/user.entity';

export type AuthenticatedUser = Omit<User, 'password'>;

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export interface SerializedUser {
  id: number;
}
