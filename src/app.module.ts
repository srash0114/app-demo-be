import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo/entities/todo.entity';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/entities/user.entity';
import { Order } from './orders/entities/order.entity';
import { Product } from './products/entities/product.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { ProductsModule } from './products/products.module';
import { Category } from './categories/entities/category.entity';
import { CartModule } from './cart/cart.module';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { ConfigModule } from '@nestjs/config';
import { OrderModule } from './orders/order.module';
import { VnpayModule } from './payment/vnpay.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [Todo, Order, User, Product, OrderItem, Category, Cart, CartItem],
      synchronize: true,
    }),
    TodoModule,
    UserModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrderModule,
    VnpayModule,
    ConfigModule.forRoot({
      isGlobal: true, // Quan trọng: Để dùng được ConfigService ở mọi nơi (Auth, User...) mà không cần import lại
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
