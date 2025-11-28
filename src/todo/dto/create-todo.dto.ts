import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTodoDto {
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString({ message: 'Mô tả phải là dạng chuỗi' })
    description?: string;
}
