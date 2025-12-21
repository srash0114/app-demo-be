import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AddProductToCategoryDto } from './dto/add-product-to-category.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }

  @Post(':id/products')
  addProductToCategory(
    @Param('id') id: string,
    @Body() addProductDto: AddProductToCategoryDto
  ) {
    return this.categoriesService.addProductToCategory(+id, addProductDto.productId);
  }

  @Delete(':id/products/:productId')
  removeProductFromCategory(
    @Param('id') id: string,
    @Param('productId') productId: string
  ) {
    return this.categoriesService.removeProductFromCategory(+id, +productId);
  }
}