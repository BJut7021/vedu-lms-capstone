import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../entities/user.entity';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [PortalController],
    providers: [PortalService],
})
export class PortalModule { }
