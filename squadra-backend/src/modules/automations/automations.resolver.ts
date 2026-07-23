import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationRule } from './models/automation-rule.model';
import { CreateRuleInput } from './dto/create-rule.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

@Resolver(() => AutomationRule)
@UseGuards(GqlAuthGuard)
export class AutomationsResolver {
  constructor(private readonly automations: AutomationsService) {}

  @Query(() => [AutomationRule], { name: 'projectRules' })
  projectRules(@Args('projectId', { type: () => ID }) projectId: string) {
    return this.automations.listByProject(projectId);
  }

  @Mutation(() => AutomationRule)
  createRule(@Args('input') input: CreateRuleInput) {
    return this.automations.create(input);
  }

  @Mutation(() => Boolean)
  setRuleEnabled(
    @Args('id', { type: () => ID }) id: string,
    @Args('enabled') enabled: boolean,
  ) {
    return this.automations.setEnabled(id, enabled);
  }

  @Mutation(() => Boolean)
  deleteRule(@Args('id', { type: () => ID }) id: string) {
    return this.automations.delete(id);
  }
}
