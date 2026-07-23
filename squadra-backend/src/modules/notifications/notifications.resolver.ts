import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './models/notification.model';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Notification)
@UseGuards(GqlAuthGuard)
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Query(() => [Notification], { name: 'inbox' })
  inbox(
    @CurrentUser() user: AuthUser,
    @Args('unreadOnly', { nullable: true }) unreadOnly?: boolean,
  ) {
    return this.notifications.inbox(user.userId, unreadOnly ?? false);
  }

  @Mutation(() => Boolean)
  markNotificationRead(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.notifications.markRead(user.userId, id);
  }

  @Mutation(() => Boolean)
  markAllNotificationsRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.userId);
  }
}
