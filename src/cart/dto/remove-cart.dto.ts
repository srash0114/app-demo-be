// src/cart/dto/remove-cart.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RemoveFromCartDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  cartItemId: number;
}