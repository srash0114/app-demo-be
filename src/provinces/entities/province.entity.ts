import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { District } from './district.entity';

@Entity('provinces')
export class Province {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @OneToMany(() => District, (district) => district.province, {
    cascade: true,
  })
  districts: District[];
}
