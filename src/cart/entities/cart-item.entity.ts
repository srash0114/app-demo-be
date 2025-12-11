// src/cart/entities/cart-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Product)
  product: Product;

  @Column('int')
  quantity: number;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  color: string;
}