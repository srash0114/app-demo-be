import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';
import provincesData from './data/provinces.json';
import districtsData from './data/districts.json';
import wardsData from './data/wards.json';

@Injectable()
export class ProvincesService implements OnModuleInit {
  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
  ) {}

  async onModuleInit() {
    const count = await this.provinceRepository.count();
    if (count === 0) {
      await this.seedData();
    }
  }

  private async seedData() {
    console.log('Seeding provinces data...');

    const provinces: Province[] = [];
    for (const item of provincesData) {
      const province = this.provinceRepository.create({
        id: item.id,
        name: item.name,
        code: item.code,
      });
      provinces.push(province);
    }
    await this.provinceRepository.save(provinces);

    const districts: District[] = [];
    for (const item of districtsData) {
      const district = this.districtRepository.create({
        id: item.id,
        name: item.name,
        code: item.code,
        province_id: item.province_id,
      });
      districts.push(district);
    }
    await this.districtRepository.save(districts);

    const wards: Ward[] = [];
    for (const item of wardsData) {
      const ward = this.wardRepository.create({
        id: item.id,
        name: item.name,
        code: item.code,
        district_id: item.district_id,
      });
      wards.push(ward);
    }
    await this.wardRepository.save(wards);

    console.log('Provinces data seeded successfully.');
  }

  async findAllProvinces(): Promise<Province[]> {
    return this.provinceRepository.find({
      relations: ['districts', 'districts.wards'],
    });
  }

  async findProvinceById(id: string): Promise<Province | null> {
    return this.provinceRepository.findOne({
      where: { id },
      relations: ['districts', 'districts.wards'],
    });
  }

  async findDistrictsByProvinceId(provinceId: string): Promise<District[]> {
    return this.districtRepository.find({
      where: { province_id: provinceId },
      relations: ['wards'],
    });
  }

  async findWardsByDistrictId(districtId: string): Promise<Ward[]> {
    return this.wardRepository.find({
      where: { district_id: districtId },
    });
  }

  async searchProvinces(query: string): Promise<Province[]> {
    return this.provinceRepository.createQueryBuilder('province')
      .where('province.name LIKE :query', { query: `%${query}%` })
      .orWhere('province.code LIKE :query', { query: `%${query}%` })
      .getMany();
  }

  async searchDistricts(query: string, provinceId?: string): Promise<District[]> {
    const qb = this.districtRepository.createQueryBuilder('district')
      .where('district.name LIKE :query', { query: `%${query}%` })
      .orWhere('district.code LIKE :query', { query: `%${query}%` });

    if (provinceId) {
      qb.andWhere('district.province_id = :provinceId', { provinceId });
    }
    return qb.getMany();
  }

  async searchWards(query: string, districtId?: string): Promise<Ward[]> {
    const qb = this.wardRepository.createQueryBuilder('ward')
      .where('ward.name LIKE :query', { query: `%${query}%` })
      .orWhere('ward.code LIKE :query', { query: `%${query}%` });

    if (districtId) {
      qb.andWhere('ward.district_id = :districtId', { districtId });
    }
    return qb.getMany();
  }
}
