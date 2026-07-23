import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import {
  CustomField,
  CustomFieldValue,
} from './models/custom-field.model';
import { CreateCustomFieldInput } from './dto/create-custom-field.input';
import { SetCustomFieldValueInput } from './dto/set-custom-field-value.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

@Resolver(() => CustomField)
@UseGuards(GqlAuthGuard)
export class CustomFieldsResolver {
  constructor(private readonly fields: CustomFieldsService) {}

  @Query(() => [CustomField], { name: 'projectCustomFields' })
  projectCustomFields(
    @Args('projectId', { type: () => ID }) projectId: string,
  ) {
    return this.fields.listByProject(projectId);
  }

  @Query(() => [CustomFieldValue], { name: 'taskCustomFieldValues' })
  taskCustomFieldValues(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.fields.valuesForTask(taskId);
  }

  @Query(() => [CustomFieldValue], { name: 'projectCustomFieldValues' })
  projectCustomFieldValues(
    @Args('projectId', { type: () => ID }) projectId: string,
  ) {
    return this.fields.valuesForProject(projectId);
  }

  @Mutation(() => CustomField)
  createCustomField(@Args('input') input: CreateCustomFieldInput) {
    return this.fields.createField(input);
  }

  @Mutation(() => Boolean)
  deleteCustomField(@Args('id', { type: () => ID }) id: string) {
    return this.fields.deleteField(id);
  }

  @Mutation(() => CustomFieldValue)
  setCustomFieldValue(@Args('input') input: SetCustomFieldValueInput) {
    return this.fields.setValue(input);
  }
}
