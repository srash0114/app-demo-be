import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Order } from './order.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column()
  price: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  product: Product;
}