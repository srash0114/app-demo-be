import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity.js';

@Entity()
@Unique(['id'])
export class ShippingAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column({ nullable: true })
  recipientName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToOne(() => User, (user) => user.shippingAddresses, { onDelete: 'CASCADE' })
  user: User;
}
