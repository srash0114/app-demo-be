import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { District } from './district.entity';

@Entity('wards')
export class Ward {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  district_id: string;

  @ManyToOne(() => District, (district) => district.wards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'district_id' })
  district: District;
}
