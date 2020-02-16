import { Module } from '@nestjs/common';
import { AccVersionService } from './services/acc-version.service';
import { AccVersionController } from './controller/acc-version.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountVersions } from './entity/accountVersion.entity';

@Module({
  imports : [TypeOrmModule.forFeature([AccountVersions])],
  providers: [AccVersionService],
  controllers: [AccVersionController],
})
export class AccVersionModule {}
