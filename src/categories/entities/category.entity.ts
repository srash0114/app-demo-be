import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity'; 

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên danh mục (Ví dụ: Áo, Quần...)

  // Một danh mục có nhiều sản phẩm
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}