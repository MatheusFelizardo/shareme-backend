import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

export interface HttpRequestError {
  error: boolean;
  message: string;
}

export interface HttpResquestSuccess {
  error: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/change-password')
  async changePassword(@Request() req) {
    try {
      const response = await this.authService.changePassword(
        req.user.id,
        req.body.newPassword,
      );
      return {
        error: false,
        data: response,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while changing password.',
      };
    }
  }
}
