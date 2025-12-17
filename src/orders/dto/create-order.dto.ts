import { IsNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  shippingAddress: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsInt()
  shippingAddressId?: number;

  notes?: string;

  // Danh sách ID sản phẩm người dùng tick chọn trong giỏ
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[]; 
}