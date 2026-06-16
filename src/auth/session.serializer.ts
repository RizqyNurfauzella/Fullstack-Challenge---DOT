import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser, SerializedUser } from './auth.types';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, payload?: SerializedUser) => void,
  ): void {
    done(null, { id: user.id });
  }

  async deserializeUser(
    payload: SerializedUser,
    done: (err: Error | null, user?: AuthenticatedUser | null) => void,
  ): Promise<void> {
    const user = await this.usersService.findById(payload.id);
    if (!user) {
      done(null, null);
      return;
    }

    const { password: _password, ...safeUser } = user;
    void _password;
    done(null, safeUser);
  }
}
