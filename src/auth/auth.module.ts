import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
// 1. Import thêm ConfigModule và ConfigService
import { ConfigModule, ConfigService } from '@nestjs/config'; 

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 2. Dùng registerAsync thay vì register
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import module chứa ConfigService
      inject: [ConfigService], // Inject service vào để dùng
      useFactory: async (configService: ConfigService) => ({
        // 3. Bây giờ em mới dùng được configService ở đây
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // Nên export để các module khác dùng được AuthGuard nếu cần
  exports: [AuthService, JwtModule, PassportModule], 
})
export class AuthModule {}