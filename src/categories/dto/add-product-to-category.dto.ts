import { IsNumber } from 'class-validator';

export class AddProductToCategoryDto {
  @IsNumber()
  productId: number;
}
