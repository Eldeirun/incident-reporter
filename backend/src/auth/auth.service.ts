import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.usersService.findOne(username);
    if (existing) throw new ConflictException('Username already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(username, hashed);
    return { message: 'User created successfully', userId: user.id };
  }

  async login(username: string, password: string, administratorOnly = false) {
    const loginError = new UnauthorizedException('Invalid credentials');

    const user = await this.usersService.findOneWithPassword(username);
    if (!user) throw loginError;

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw loginError;
    if (administratorOnly && user.role !== UserRole.ADMINISTRATOR) {
      throw loginError;
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}
