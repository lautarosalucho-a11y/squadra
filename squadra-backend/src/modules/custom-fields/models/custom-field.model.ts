import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

export enum CustomFieldType {
  text = 'text',
  number = 'number',
  dropdown = 'dropdown',
}
registerEnumType(CustomFieldType, { name: 'CustomFieldType' });

@ObjectType()
export class CustomField {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  projectId!: string;

  @Field()
  name!: string;

  @Field(() => CustomFieldType)
  type!: CustomFieldType;

  // [{ id, label, color }] cuando type = dropdown
  @Field(() => GraphQLJSON, { nullable: true })
  options?: unknown;

  @Field(() => Float)
  position!: number;
}

@ObjectType()
export class CustomFieldValue {
  @Field(() => ID)
  taskId!: string;

  @Field(() => ID)
  customFieldId!: string;

  // { text } | { number } | { optionId }
  @Field(() => GraphQLJSON, { nullable: true })
  value?: unknown;
}
