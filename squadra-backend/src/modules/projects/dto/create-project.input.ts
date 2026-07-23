import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field(() => ID)
  @IsUUID()
  workspaceId!: string;

  @Field()
  @IsString()
  @MaxLength(200)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['list', 'board', 'calendar', 'gantt'])
  defaultView?: string;
}
