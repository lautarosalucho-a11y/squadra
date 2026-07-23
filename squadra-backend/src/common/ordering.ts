/**
 * Orden fraccional para reordenar por drag & drop sin reescribir filas.
 * Se calcula un valor intermedio entre los vecinos.
 *
 *   before=1.0, after=2.0  -> 1.5
 *   before=null (inicio)   -> after - 1
 *   after=null  (final)    -> before + 1
 *   ambos null (vacío)     -> 1
 */
export function fractionalPosition(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) return 1;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}
