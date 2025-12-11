// src/products/products.controller.ts
import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetRandomProductDto } from './dto/get-random-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('random')
  getRandom(@Query() dto: GetRandomProductDto) {
    return this.productsService.findRandom(dto);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('batch')
    createBatch(@Body() createProductDtos: CreateProductDto[]) {
    return this.productsService.createBatch(createProductDtos);
  }
}