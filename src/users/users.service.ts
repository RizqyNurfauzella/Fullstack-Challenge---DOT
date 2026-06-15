import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createInitialUser(): Promise<void> {
    const existing = await this.findByEmail('admin@admin.com');
    if (!existing) {
      const user = new User();
      user.name = 'Administrator';
      user.email = 'admin@admin.com';
      user.password = await bcrypt.hash('password123', 10);
      user.role = 'admin';
      await this.usersRepository.save(user);
    }
  }
}
