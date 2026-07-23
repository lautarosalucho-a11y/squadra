import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { Goal } from './models/goal.model';
import { CreateGoalInput, UpdateGoalInput } from './dto/goal.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Goal)
@UseGuards(GqlAuthGuard)
export class GoalsResolver {
  constructor(private readonly goals: GoalsService) {}

  @Query(() => [Goal], { name: 'myGoals' })
  myGoals(@CurrentUser() user: AuthUser) {
    return this.goals.myGoals(user.userId);
  }

  @Mutation(() => Goal)
  createGoal(
    @Args('input') input: CreateGoalInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.goals.create(user.userId, input);
  }

  @Mutation(() => Goal)
  updateGoal(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateGoalInput,
  ) {
    return this.goals.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteGoal(@Args('id', { type: () => ID }) id: string) {
    return this.goals.remove(id);
  }
}
