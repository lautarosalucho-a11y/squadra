import {
  ObjectType,
  Field,
  ID,
  Int,
  GraphQLISODateTime,
} from '@nestjs/graphql';

/** Metadatos de un adjunto (nunca incluye el binario). */
@ObjectType()
export class Attachment {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  taskId!: string;

  @Field()
  fileName!: string;

  @Field({ nullable: true })
  mimeType?: string | null;

  @Field(() => Int, { nullable: true })
  sizeBytes?: number | null;

  @Field(() => ID, { nullable: true })
  uploadedById?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

/** Contenido del adjunto en base64 (para descargar). */
@ObjectType()
export class AttachmentData {
  @Field()
  fileName!: string;

  @Field({ nullable: true })
  mimeType?: string | null;

  @Field()
  base64!: string;
}
