import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { AddCommentInput } from './dto/add-comment.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Comment)
@UseGuards(GqlAuthGuard)
export class CommentsResolver {
  constructor(private readonly comments: CommentsService) {}

  @Query(() => [Comment], { name: 'taskComments' })
  taskComments(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.comments.list(taskId);
  }

  @Mutation(() => Comment)
  addComment(
    @Args('input') input: AddCommentInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.add(input, user.userId);
  }
}
