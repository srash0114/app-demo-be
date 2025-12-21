// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { GetRandomProductDto } from './dto/get-random-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import * as cloudinary from 'cloudinary';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {
    cloudinary.v2.config({
      cloud_name: 'daefr1x4m',
      api_key: '599638596127863',
      api_secret: 'PqJkaE0c_asG1eQJDQ5wuEtfzZw',
    });
  }

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
    let category: Category | null = null;
    if (createProductDto.categoryId) {
      category = await this.categoriesRepository.findOne({ where: { id: createProductDto.categoryId } });
      if (!category) {
        throw new Error(`Category with ID ${createProductDto.categoryId} not found`);
      }
    }

    // Upload image to Cloudinary
    let imageUrl = '';
    if (createProductDto.imageBase64) {
      const uploadResult = await cloudinary.v2.uploader.upload(createProductDto.imageBase64, {
        folder: 'products',
      });
      imageUrl = uploadResult.secure_url;
    }

    const { imageBase64, ...productData } = createProductDto;

    const newProduct = this.productsRepository.create({
      ...productData,
      price: createProductDto.price,
      rating: createProductDto.rating || 0,
      reviewCount: createProductDto.reviewCount || 0,
      category,
      imageUrl,
    });

    return await this.productsRepository.save(newProduct);
  }

  async createBatch(userId: string, createProductDtos: CreateProductDto[]): Promise<Product[]> {
    // Lấy danh sách categoryIds duy nhất
    const categoryIds = [...new Set(createProductDtos.map(dto => dto.categoryId).filter(id => id))];
    const categories = categoryIds.length > 0 ? await this.categoriesRepository.findByIds(categoryIds) : [];
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    const products = await Promise.all(createProductDtos.map(async dto => {
      const category = dto.categoryId ? categoryMap.get(dto.categoryId)! : null;
      if (dto.categoryId && !category) {
        throw new Error(`Category with ID ${dto.categoryId} not found`);
      }

      // Upload image
      let imageUrl = '';
      if (dto.imageBase64) {
        const uploadResult = await cloudinary.v2.uploader.upload(dto.imageBase64, {
          folder: 'products',
        });
        imageUrl = uploadResult.secure_url;
      }

      const { imageBase64, ...productData } = dto;

      return this.productsRepository.create({
        ...productData,
        userId: userId,
        price: dto.price,
        rating: dto.rating || 0,
        reviewCount: dto.reviewCount || 0,
        category,
        imageUrl,
      });
    }));

    // Lưu một lần cho hiệu quả
    return await this.productsRepository.save(products);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  async search(dto: SearchProductDto): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (dto.name) {
      query.andWhere('product.name LIKE :name', { name: `%${dto.name}%` });
    }

    if (dto.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    if (dto.minPrice) {
      query.andWhere('product.price >= :minPrice', { minPrice: dto.minPrice });
    }

    if (dto.maxPrice) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    return await query.getMany();
  }

  async update(id: number, updateProductDto: any): Promise<Product> {
    let category: Category | null = null;
    if (updateProductDto.categoryId) {
      category = await this.categoriesRepository.findOne({ where: { id: updateProductDto.categoryId } });
      if (!category) {
        throw new Error(`Category with ID ${updateProductDto.categoryId} not found`);
      }
    }

    const existingProduct = await this.findOne(id);
    let imageUrl = existingProduct.imageUrl;

    if (updateProductDto.imageBase64) {
      // Xóa hình cũ nếu có
      if (existingProduct.imageUrl) {
        const publicId = this.extractPublicId(existingProduct.imageUrl);
        await cloudinary.v2.uploader.destroy(publicId);
      }
      // Upload hình mới
      const uploadResult = await cloudinary.v2.uploader.upload(updateProductDto.imageBase64, {
        folder: 'products',
      });
      imageUrl = uploadResult.secure_url;
    }

    const { imageBase64, ...updateData } = updateProductDto;

    await this.productsRepository.update(id, { 
      ...updateData, 
      category,
      imageUrl,
    });
    return this.findOne(id);
  }

  private extractPublicId(url: string): string {
    // URL format: https://res.cloudinary.com/daefr1x4m/image/upload/v.../products/image.jpg
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = `products/${filename.split('.')[0]}`;
    return publicId;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id); // Check tồn tại
    // Xóa hình trên Cloudinary
    if (product.imageUrl) {
      const publicId = this.extractPublicId(product.imageUrl);
      await cloudinary.v2.uploader.destroy(publicId);
    }
    await this.productsRepository.delete(id);
  }

async deleteAll() {
    // 1. Tắt khóa ngoại (SQLite)
    await this.dataSource.query('PRAGMA foreign_keys = OFF;');
    
    try {
      // --- SỬA Ở ĐÂY ---
      // Thay vì dùng .delete({}), hãy dùng .clear()
      // .clear() sẽ xóa toàn bộ dữ liệu trong bảng một cách hợp lệ
      await this.productsRepository.clear();

      // 2. Reset ID về 1
      await this.dataSource.query("DELETE FROM sqlite_sequence WHERE name = 'product'"); 
    } catch (error) {
      throw error;
    } finally {
      // 3. Bật lại khóa ngoại (Luôn chạy dù lỗi hay không)
      await this.dataSource.query('PRAGMA foreign_keys = ON;');
    }

    return { message: 'Đã xóa sạch sản phẩm và reset ID (SQLite)' };
  }

}