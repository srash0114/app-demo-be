export class ProvinceDto {
  id: string;
  name: string;
  code: string;
}

export class DistrictDto {
  id: string;
  name: string;
  code: string;
  province_id: string;
}

export class WardDto {
  id: string;
  name: string;
  code: string;
  district_id: string;
}

export class ProvinceDetailDto extends ProvinceDto {
  districts: DistrictDto[];
}

export class DistrictDetailDto extends DistrictDto {
  wards: WardDto[];
}
