import { Injectable } from '@nestjs/common';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface/payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByEmail(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = bcrypt.compareSync(pass, user.password);
    if (user && isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: JwtPayload) {
    const payload = { sub: user.id, ...user };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: number, newPassword: string) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const response = await this.usersService.updatePassword(
      userId,
      hashedPassword,
    );
    return response;
  }
}
