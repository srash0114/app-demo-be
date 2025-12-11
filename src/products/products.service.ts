// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { GetRandomProductDto } from './dto/get-random-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findRandom(dto: GetRandomProductDto): Promise<Product[]> {
    const limit = dto.limit || 12; // Mặc định lấy 12 cái
    
    // Tạo Query Builder
    const query = this.productsRepository.createQueryBuilder('product');

    // Xử lý loại trừ các ID đã có (Load more)
    if (dto.excludeIds) {
      // Chuyển chuỗi "1,2,3" thành mảng [1, 2, 3]
      const idsToExclude = dto.excludeIds.split(',').map(id => parseInt(id.trim()));
      
      if (idsToExclude.length > 0) {
        // SQL: WHERE product.id NOT IN (1, 2, 3)
        query.where('product.id NOT IN (:...ids)', { ids: idsToExclude });
      }
    }

    // Lấy ngẫu nhiên
    // Lưu ý: SQLite dùng RANDOM(), MySQL dùng RAND()
    query.orderBy('RANDOM()');
    
    // Giới hạn số lượng
    query.take(limit);

    // Lấy kèm category nếu cần hiển thị tên danh mục
    query.leftJoinAndSelect('product.category', 'category');

    return await query.getMany();
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {

    const newProduct = this.productsRepository.create({
      ...createProductDto,
      price: createProductDto.price,
      rating: createProductDto.rating || 0,
      reviewCount: createProductDto.reviewCount || 0
    });

    return await this.productsRepository.save(newProduct);
  }

  async createBatch(createProductDtos: CreateProductDto[]): Promise<Product[]> {
    const products = createProductDtos.map(dto => {
      return this.productsRepository.create({
        ...dto,
        price: dto.price,
        rating: dto.rating || 0,
        reviewCount: dto.reviewCount || 0
      });
    });

    // Lưu một lần cho hiệu quả
    return await this.productsRepository.save(products);
  }
}