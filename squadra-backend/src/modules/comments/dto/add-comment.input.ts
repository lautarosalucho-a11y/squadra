import { InputType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsUUID, IsArray, IsOptional, ArrayUnique } from 'class-validator';

@InputType()
export class AddCommentInput {
  @Field(() => ID)
  @IsUUID()
  taskId!: string;

  /** Rich text serializado (p. ej. { text, spans } ). */
  @Field(() => GraphQLJSON)
  body!: unknown;

  /** userIds mencionados (@usuarios). */
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  mentions?: string[];
}
