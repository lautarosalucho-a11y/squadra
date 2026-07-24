import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Attachment, AttachmentData } from './models/attachment.model';
import { UploadAttachmentInput } from './dto/upload-attachment.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Resolver(() => Attachment)
@UseGuards(GqlAuthGuard)
export class AttachmentsResolver {
  constructor(private readonly attachments: AttachmentsService) {}

  @Query(() => [Attachment], { name: 'taskAttachments' })
  taskAttachments(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.attachments.list(taskId);
  }

  @Query(() => AttachmentData, { name: 'attachmentData' })
  attachmentData(@Args('id', { type: () => ID }) id: string) {
    return this.attachments.data(id);
  }

  @Mutation(() => Attachment)
  uploadAttachment(
    @Args('input') input: UploadAttachmentInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachments.upload(input, user.userId);
  }

  @Mutation(() => Boolean)
  deleteAttachment(@Args('id', { type: () => ID }) id: string) {
    return this.attachments.remove(id);
  }
}
