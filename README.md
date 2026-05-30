# Gallery Wall Planner

A browser-based gallery wall planner. Arrange artwork, posters, frames, and any rectangular items on a virtual wall — visualize layouts before hanging anything, then export the result.

## Features

### Wall Setup
- Set wall dimensions in **inches, centimeters, feet, or meters**
- Adjust spacing gap between items with slider or precise numeric input
- Set a wall background color
- Upload a photo of your actual wall for a realistic preview
- **Define a usable area** on the photo — select only the open wall space (avoiding windows, doors, etc.) and enter its real-world dimensions; the full photo stays visible for spatial context

### Item Management
- Add items (artwork, posters, frames, prints) by specifying width and height
- Per-item name, color, and photo attachment
- Lock individual items to prevent accidental moves
- Resize items by dragging corner and edge handles
- Rotate by dragging the rotation handle above each item

### Layout Tools
| Tool | What it does |
|---|---|
| **Drag** | Move an item anywhere on the wall |
| **Rotate handle** | Free-rotate (snaps to 15° when snap is on) |
| **Resize handles** | 8-point resize with opposite-anchor math |
| **Shuffle** | Swap items with identical dimensions randomly |
| **Cluster** | Rearrange all items using a randomly selected layout pattern |
| **Clear** | Remove all items from Settings → Danger Zone |
| **Demo** | Load a sample gallery layout (requires confirmation) |

### Cluster Patterns
Seven patterns are available. Enable any combination in **Settings → Cluster Patterns**; the Cluster button picks randomly from enabled ones each time:

| Pattern | Description |
|---|---|
| Shelf | Compact centered rows |
| Cross | Plus / + shape with arms |
| Diagonal | Staircase cascade |
| Brick | Offset alternating rows |
| Grid | Even columns and rows |
| Column | Single centered vertical stack |
| Scattered | Organic spread with slight rotations |

When **Overlap** is disabled, Cluster automatically resolves any collisions after placing items with an improved physics-based separation algorithm (up to 100 iterations).

**Feasibility Check**: The cluster function now validates that your items can physically fit within the wall area considering spacing requirements. If clustering is impossible (e.g., items are too large or gap is too wide), you'll receive a helpful error message with suggestions.

### Settings
- **Units** — Inches, Centimeters, Feet, or Meters (with live ruler updates)
- **Gap** — Adjustable via slider or numeric input for precise spacing control
- **Overlap** — Allow or block item-on-item overlap (enforced during drag, rotate, and cluster)
- **Snap** — Snap items to a configurable pixel grid
- **Cluster Patterns** — Multi-select which patterns the Cluster button draws from
- **Appearance** — Dark / Light mode toggle
- **Danger Zone** — Clear all items or reset everything to defaults

### History
- 50-step undo/redo (`Ctrl+Z` / `Ctrl+Y` or toolbar buttons)
- Full history panel in the left sidebar (expanded by default)
- Hover any entry to **Restore** directly to that state

### Import / Export
- **Import Plan** — Restore a previously exported layout from JSON
- **Export Plan** — Save the full layout (wall, items, and embedded images) as a JSON file
- **Export As...** — Multiple export formats:
  - **PNG Image** — Standard raster export with items, photos, labels, and rotation
  - **WebP Image** — Efficient compressed image format
  - **SVG Vector** — Scalable vector graphics for print-quality output

### Display
- **Auto-fit** — Wall scales automatically to fill the viewport
- **Zoom controls** — `−` / `Fit` / `+` in the toolbar (relocated from canvas area)
- **Rulers** — Toggle with improved switch control in toolbar
  - Automatically adjusts to selected measurement unit (in/cm/ft/m)
  - Enhanced readability with larger text and better contrast
  - Positioned flush with usable wall area

## UI Improvements

- **Consistent button heights** — All toolbar buttons standardized to 32px
- **Better text contrast** — Improved readability in both light and dark modes
- **Larger sidebar text** — Section headers and labels increased for better legibility
- **Generic terminology** — Changed from "Canvas" to "Item" throughout the interface
- **Professional toggle switch** — Proper toggle design for ruler visibility
- **Wider dimension inputs** — More space for entering wall and item sizes
- **Proper cursors** — Text cursor for text/number inputs, pointer for interactive elements

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Building

```bash
npm run build
```

Output goes to `dist/`. The app is fully client-side with no backend.

## Tech Stack

- **React 19** + **TypeScript**
- **Zustand 5** (with `persist` middleware — layout saved to `localStorage`, images to IndexedDB)
- **Tailwind CSS v4**
- **Vite 6**
- **Font Awesome** (free solid icons)

## Data & Privacy

Everything runs in the browser. No data is sent to any server. Layout state persists in `localStorage`; uploaded images persist in `IndexedDB`. Clearing site data removes all stored layouts.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Enter` (in inputs) | Confirm value |
| `Escape` (in inputs) | Cancel / revert |
