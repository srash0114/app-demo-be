// src/products/entities/product.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { OneToMany } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() 
  userId: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'text' })
  imageBase64: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column('simple-array', { nullable: true })
  sizes: string[];

  @Column('simple-array', { nullable: true })
  colors: string[];

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
  
}