import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateSectionInput {
  @Field(() => ID)
  @IsUUID()
  projectId!: string;

  @Field()
  @IsString()
  @MaxLength(120)
  name!: string;
}

@InputType()
export class MoveSectionInput {
  @Field(() => ID)
  @IsUUID()
  sectionId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  beforeSectionId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  afterSectionId?: string;
}
