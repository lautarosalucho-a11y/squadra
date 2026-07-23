import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsResolver } from './goals.resolver';

@Module({
  providers: [GoalsService, GoalsResolver],
  exports: [GoalsService],
})
export class GoalsModule {}
