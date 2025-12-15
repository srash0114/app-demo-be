// src/payment/vnpay.module.ts
import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Cần ConfigModule để sử dụng ConfigService trong VnpayService
  providers: [VnpayService],
  exports: [VnpayService], // Bắt buộc phải export để OrderModule có thể Inject VnpayService
})
export class VnpayModule {}