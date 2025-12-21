import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async addFavorite(userId: string, productId: number): Promise<Favorite> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictException('Product already in favorites');
    }

    const favorite = this.favoritesRepository.create({ userId, productId, product });
    return await this.favoritesRepository.save(favorite);
  }

  async removeFavorite(userId: string, productId: number): Promise<void> {
    const result = await this.favoritesRepository.delete({ userId, productId });
    if (result.affected === 0) {
      throw new NotFoundException('Favorite not found');
    }
  }

  async getUserFavorites(userId: string): Promise<any[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
    return favorites.map(fav => fav.product);
  }
}
