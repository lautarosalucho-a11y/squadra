import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

/** Contadores por tarea para los indicadores de la lista. */
@ObjectType()
export class TaskMeta {
  @Field(() => ID)
  taskId!: string;

  @Field(() => Int)
  attachmentCount!: number;

  @Field(() => Int)
  commentCount!: number;

  /** Comentarios/menciones sin leer del usuario autenticado en esa tarea. */
  @Field(() => Int)
  unreadCommentCount!: number;
}
