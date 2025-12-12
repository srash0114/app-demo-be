// src/cart/cart.controller.ts
import { Controller, Get, Post, Body, Delete, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-cart.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from '@nestjs/common';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

// 1. Xem giỏ hàng (GET)
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  // 2. Thêm hoặc Sửa số lượng (POST)
  @Post('add')
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    dto.userId = req.user.userId; // Gán ID từ token vào DTO
    return this.cartService.addToCart(dto);
  }

  @Delete('remove')
  removeFromCart(@Request() req, @Body() dto: RemoveFromCartDto) {
    dto.userId = req.user.userId; 
    return this.cartService.removeItem(dto.userId, dto.cartItemId);
  }

  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}