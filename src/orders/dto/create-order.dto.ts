import { IsNotEmpty, IsArray, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  shippingAddress: string;

  notes?: string;

  // Danh sách ID sản phẩm người dùng tick chọn trong giỏ
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[]; 
}