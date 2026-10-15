import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../../config/app-config.service';
import { AuthController } from './auth.controller';
import { AuthNotifications } from './auth.notifications';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { issuer: 'changecars', audience: 'changecars-api' },
        verifyOptions: { issuer: 'changecars', audience: 'changecars-api' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthNotifications],
  exports: [AuthService],
})
export class AuthModule {}
