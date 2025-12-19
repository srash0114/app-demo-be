import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';

@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Get()
  async getAllProvinces(): Promise<Province[]> {
    return this.provincesService.findAllProvinces();
  }

  @Get(':id')
  async getProvinceById(@Param('id') id: string): Promise<Province | null> {
    return this.provincesService.findProvinceById(id);
  }

  @Get(':provinceId/districts')
  async getDistrictsByProvinceId(@Param('provinceId') provinceId: string): Promise<District[]> {
    return this.provincesService.findDistrictsByProvinceId(provinceId);
  }

  @Get('districts/:districtId/wards')
  async getWardsByDistrictId(@Param('districtId') districtId: string): Promise<Ward[]> {
    return this.provincesService.findWardsByDistrictId(districtId);
  }

  @Get('search/province')
  async searchProvinces(@Query('q') query: string): Promise<Province[]> {
    return this.provincesService.searchProvinces(query);
  }

  @Get('search/district')
  async searchDistricts(
    @Query('q') query: string,
    @Query('province_id') provinceId?: string,
  ): Promise<District[]> {
    return this.provincesService.searchDistricts(query, provinceId);
  }

  @Get('search/ward')
  async searchWards(
    @Query('q') query: string,
    @Query('district_id') districtId?: string,
  ): Promise<Ward[]> {
    return this.provincesService.searchWards(query, districtId);
  }
}
