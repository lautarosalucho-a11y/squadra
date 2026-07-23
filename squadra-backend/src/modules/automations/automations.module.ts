import { Module } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsResolver } from './automations.resolver';

@Module({
  providers: [AutomationsService, AutomationsResolver],
  exports: [AutomationsService],
})
export class AutomationsModule {}
