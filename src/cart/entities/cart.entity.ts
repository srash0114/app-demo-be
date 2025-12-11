// src/cart/entities/cart.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string; 

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];
}