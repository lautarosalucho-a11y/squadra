import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
