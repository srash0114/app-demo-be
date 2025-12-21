import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddFavoriteDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
