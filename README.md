# Gallery Wall Planner

A browser-based gallery wall planner. Arrange canvases, posters, framed prints, and any rectangular artwork on a virtual wall — visualize layouts before hanging anything, then export the result.

## Features

### Wall Setup
- Set wall dimensions in **inches, centimeters, or feet**
- Set a wall background color
- Upload a photo of your actual wall for a realistic preview
- **Define a usable area** on the photo — select only the open wall space (avoiding windows, doors, etc.) and enter its real-world dimensions; the full photo stays visible for spatial context

### Piece Management
- Add pieces (canvases, posters, frames, prints) by specifying width and height
- Per-piece name, color, and photo attachment
- Lock individual pieces to prevent accidental moves
- Resize pieces by dragging corner and edge handles
- Rotate by dragging the rotation handle above each piece

### Layout Tools
| Tool | What it does |
|---|---|
| **Drag** | Move a canvas anywhere on the wall |
| **Rotate handle** | Free-rotate (snaps to 15° when snap is on) |
| **Resize handles** | 8-point resize with opposite-anchor math |
| **Shuffle** | Swap similar-sized canvases randomly |
| **Cluster** | Rearrange all canvases using a randomly selected layout pattern |
| **Clear** | Remove all canvases (requires confirmation) |
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

When **Overlap** is disabled, Cluster automatically resolves any collisions after placing pieces.

### Settings
- **Units** — Inches, Centimeters, or Feet
- **Overlap** — Allow or block canvas-on-canvas overlap (enforced during drag, rotate, and cluster)
- **Snap** — Snap pieces to a configurable grid
- **Cluster Patterns** — Multi-select which patterns the Cluster button draws from

### History
- 50-step undo/redo (`Ctrl+Z` / `Ctrl+Y` or toolbar buttons)
- Full history panel in the left sidebar; hover any entry to **Restore** directly to that state

### Import / Export
- **Export JSON** — Save the full layout (wall, canvases, and embedded images) as a JSON file
- **Import JSON** — Restore a previously exported layout
- **Save Image** — Export the wall as a PNG (pieces with photos, labels, correct rotation)

### Display
- **Auto-fit** — Wall scales automatically to fill the viewport
- **Zoom controls** — `−` / `Fit` / `+` at the bottom of the canvas area
- **Rulers** — Toggle on/off with "Rulers on/off" button
- **Dark / Light mode** — Persisted in settings

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
