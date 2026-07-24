import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class UploadAttachmentInput {
  @Field(() => ID)
  @IsUUID()
  taskId!: string;

  @Field()
  @IsString()
  @MaxLength(300)
  fileName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string;

  /** Contenido del archivo en base64. */
  @Field()
  @IsString()
  base64!: string;
}
