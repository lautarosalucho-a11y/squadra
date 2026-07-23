# Squadra — Design System

> Fundación visual del frontend. Todo componente consume **tokens**, nunca valores hardcodeados.
> Fuente de verdad en código: `src/styles/tokens.css` (CSS custom properties).

## Principios

1. **Consistencia sobre creatividad** — el sistema evita reinventar la rueda por pantalla.
2. **Flexibilidad dentro de límites** — componentes componibles, no rígidos.
3. **Densidad de información** — Squadra es una herramienta de trabajo: legible, compacta, rápida.
4. **Accesible por defecto** — contraste AA, foco visible, navegación por teclado.

---

## 1. Design Tokens

### Color — Marca
| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-50` | `#EEF2FF` | Fondos sutiles, hover ghost |
| `--brand-100` | `#E0E7FF` | Chips, selección |
| `--brand-500` | `#6366F1` | Color primario (botones, links) |
| `--brand-600` | `#4F46E5` | Hover primario |
| `--brand-700` | `#4338CA` | Active/pressed |

### Color — Neutrales
| Token | Valor | Uso |
|-------|-------|-----|
| `--gray-0` | `#FFFFFF` | Superficie base |
| `--gray-50` | `#F8FAFC` | Fondo app |
| `--gray-100` | `#F1F5F9` | Columnas Kanban, hover filas |
| `--gray-200` | `#E2E8F0` | Bordes |
| `--gray-400` | `#94A3B8` | Texto terciario, placeholders |
| `--gray-600` | `#475569` | Texto secundario |
| `--gray-900` | `#0F172A` | Texto principal |

### Color — Semántico y Estados de Tarea
Mapea 1:1 con el enum `TaskStatus` del backend (`todo`, `in_progress`, `in_review`, `done`, `blocked`).

| Estado | `--status-*-bg` | `--status-*-fg` |
|--------|-----------------|-----------------|
| todo | `#F1F5F9` | `#475569` |
| in_progress | `#DBEAFE` | `#1D4ED8` |
| in_review | `#FEF3C7` | `#B45309` |
| done | `#DCFCE7` | `#15803D` |
| blocked | `#FEE2E2` | `#B91C1C` |

Semánticos generales: `--success #16A34A`, `--warning #D97706`, `--danger #DC2626`, `--info #2563EB`.

### Tipografía
- **Familia:** `Inter, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Escala** (`--text-*`): `xs 12` · `sm 13` · `md 14` (base UI) · `lg 16` · `xl 20` · `2xl 28`.
- **Pesos:** 400 regular, 500 medium, 600 semibold.
- **Line-height:** `1.5` cuerpo, `1.25` títulos.

### Spacing (base 4px)
`--space-1 4` · `2 8` · `3 12` · `4 16` · `5 20` · `6 24` · `8 32` · `10 40`.

### Bordes y Radios
`--radius-sm 6` · `--radius-md 8` · `--radius-lg 12` · `--radius-full 9999`. Borde estándar `1px solid var(--gray-200)`.

### Sombras (elevación)
| Token | Uso |
|-------|-----|
| `--shadow-xs` | Cards en reposo |
| `--shadow-sm` | Dropdowns, popovers |
| `--shadow-md` | Card arrastrada (dragging), modales |

### Motion
`--motion-fast 120ms` · `--motion-base 180ms` · easing `cubic-bezier(0.2, 0, 0, 1)`. Respeta `prefers-reduced-motion`.

---

## 2. Componentes base

| Componente | Variantes | Estados | Archivo |
|------------|-----------|---------|---------|
| **Button** | primary · secondary · ghost · danger | default, hover, active, disabled, loading | `ui/Button.tsx` |
| **Input** | text · con error | default, focus, disabled, error | `ui/Input.tsx` |
| **StatusPill** | 5 estados de tarea | — | `ui/StatusPill.tsx` |
| **Avatar** | sm · md | con imagen / iniciales | `ui/Avatar.tsx` |
| **Card** | default · interactive | default, hover, dragging | `ui/Card.tsx` |

Cada uno documenta props, estados y notas a11y en su propio archivo (JSDoc).

---

## 3. Patrones

- **Vista Tablero (Kanban):** columnas por *sección*; drag entre columnas = `moveTask(sectionId)`. Cada card muestra título, `StatusPill`, responsable (Avatar) y fecha.
- **Feedback:** estados vacíos con CTA, skeletons en carga, toasts para errores de mutación.
- **Navegación:** sidebar de proyectos + switcher de vistas (Lista · Tablero · Calendario · Gantt).

## Roadmap de vistas
Tablero (implementada) → Lista → Calendario → Cronograma (Gantt). Todas consumen `projectTasks` variando `groupBy` y el renderizado.
