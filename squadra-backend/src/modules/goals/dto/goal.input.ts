import { InputType, Field, ID, Int, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDate,
} from 'class-validator';
import { GoalStatus } from '../models/goal.model';

@InputType()
export class CreateGoalInput {
  @Field()
  @IsString()
  @MaxLength(300)
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  dueDate?: Date;
}

@InputType()
export class UpdateGoalInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => GoalStatus, { nullable: true })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  dueDate?: Date | null;
}
