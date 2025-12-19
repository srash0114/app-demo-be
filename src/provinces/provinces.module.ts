import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Province, District, Ward]),
  ],
  controllers: [ProvincesController],
  providers: [ProvincesService],
  exports: [ProvincesService],
})
export class ProvincesModule {}
