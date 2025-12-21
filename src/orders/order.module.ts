// src/orders/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

// Import các Module phụ thuộc
import { CartModule } from 'src/cart/cart.module'; 
import { VnpayModule } from 'src/payment/vnpay.module';
import { ProductsModule } from 'src/products/products.module'; // Cần Product để kiểm tra giá
import { Product } from 'src/products/entities/product.entity'; // Import Product entity
import { ShippingAddress } from '../user/entities/shipping-address.entity.js';
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, ShippingAddress, Product]),
    
    CartModule,
    VnpayModule,
    ProductsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule.forFeature([Order, OrderItem, ShippingAddress])],
})
export class OrderModule {}