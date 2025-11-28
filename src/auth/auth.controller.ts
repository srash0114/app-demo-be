// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto'; // Dùng cho register
import { LoginDto } from './dto/login.dto'; // Cần tạo file này

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK) // Mặc định POST là 201, đổi sang 200 cho login
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    // 1. Validate
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    
    // 2. Tạo token
    return this.authService.login(user);
  }
}