// src/products/products.controller.ts
import { Controller, Get, Query, Post, Body, Delete, UseGuards, Patch, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetRandomProductDto } from './dto/get-random-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('random')
  getRandom(@Query() dto: GetRandomProductDto) {
    return this.productsService.findRandom(dto);
  }

  @Get('search')
  search(@Query() dto: SearchProductDto) {
    return this.productsService.search(dto);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('batch')
    createBatch(@Request() req ,@Body() createProductDtos: CreateProductDto[]) {
    return this.productsService.createBatch(req.user.userId , createProductDtos);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  // @Delete('clear') // Gọi API: DELETE http://localhost:3000/products/clear
  // deleteAll() {
  //   return this.productsService.deleteAll();
  // }
}