import { Controller, Request, Post, UseGuards, Get, Res } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthenticatedGuard } from './authenticated.guard';

@Controller('api/auth')
export class AuthController {
  
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return { message: 'Logged in successfully', user: req.user };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('logout')
  logout(@Request() req, @Res() res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  }
}
