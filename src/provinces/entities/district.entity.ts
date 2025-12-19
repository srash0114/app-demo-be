import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Province } from './province.entity';
import { Ward } from './ward.entity';

@Entity('districts')
export class District {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  province_id: string;

  @ManyToOne(() => Province, (province) => province.districts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @OneToMany(() => Ward, (ward) => ward.district, {
    cascade: true,
  })
  wards: Ward[];
}
