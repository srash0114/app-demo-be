// src/cart/dto/add-to-cart.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;
}