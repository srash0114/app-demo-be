import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity'; // Sửa lại đường dẫn đúng User của bạn
import { OrderItem } from './order-item.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date; // Ngày đặt hàng

  @Column()
  totalPrice: string; // Tổng tiền đơn hàng

  @Column({ default: 'PENDING' })
  status: string; // Trạng thái: PENDING, COMPLETED, CANCELLED

  @Column()
  shippingAddress: string;

  @Column({ nullable: true })
  shippingRecipientName?: string;

  @Column({ nullable: true })
  shippingPhone?: string;

  @Column({ type: 'int', nullable: true })
  shippingAddressId?: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  paymentUrl: string; // Lưu link thanh toán VNPay

  @Column({ nullable: true })
  paymentExpireAt: Date; // Thời gian hết hạn link thanh toán

  // Mối quan hệ: Nhiều đơn hàng thuộc về 1 User
  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  // Mối quan hệ: Một đơn hàng có nhiều dòng chi tiết sản phẩm
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];
}