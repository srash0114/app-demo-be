// src/cart/cart.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-cart.dto'; 
import { ForbiddenException } from '@nestjs/common';
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async addToCart(dto: AddToCartDto) {
    let cart = await this.cartRepository.findOne({ 
        where: { userId: dto.userId },
        relations: ['items', 'items.product'] 
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId: dto.userId, items: [] });
      await this.cartRepository.save(cart);
    }

    const product = await this.productRepository.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    const existingItem = (cart.items || []).find(item => 
        item.product.id === dto.productId && 
        item.size === dto.size && 
        item.color === dto.color
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      return await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        quantity: dto.quantity,
        size: dto.size,
        color: dto.color
      });
      return await this.cartItemRepository.save(newItem);
    }
  }

  async getCart(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
        return { items: [], totalPrice: 0 };
    }

    const totalPrice = cart.items.reduce((sum, item) => {
        return sum + (item.quantity * Number(item.product.price));
    }, 0);

    return { ...cart, totalPrice };
  }

  // Gợi ý: Đổi logic controller để nhận cartItemId
  async removeItem(userId: string, cartItemId: number) {
      const cartItem = await this.cartRepository.findOne({
          where: { userId },
          relations: ['items', 'items.product', 'items.cart'],
      });

      if (!cartItem) throw new NotFoundException('Mục không tồn tại');

      await this.cartItemRepository.delete(cartItemId);
      return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const result = await this.cartRepository.delete({ userId: userId });
    
    return { 
      message: 'Đã xóa sạch giỏ hàng', 
      deletedCount: result.affected 
    };
  }
}