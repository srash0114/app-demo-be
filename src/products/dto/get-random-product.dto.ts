// src/products/dto/get-random-product.dto.ts
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRandomProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number; // Số lượng cần lấy (Mặc định 12)

  @IsOptional()
  @IsString()
  excludeIds?: string; // Chuỗi ID đã có, ví dụ: "1,2,3,4"
}