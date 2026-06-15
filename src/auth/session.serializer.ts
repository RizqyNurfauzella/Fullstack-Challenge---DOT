import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  serializeUser(user: any, done: CallableFunction): void {
    done(null, { id: user.id });
  }

  async deserializeUser(payload: any, done: CallableFunction): Promise<void> {
    const user = await this.usersService.findById(payload.id);
    done(null, user);
  }
}
