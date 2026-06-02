# Gallery Wall Planner

Browser-based gallery wall planner with AI image processing.

## Features

- Drag & drop canvas with adjustable measurements (in/cm/mm)
- Pre-built layouts (shelf, cross, diagonal, grid, scattered)
- Undo/redo and export/import (JSON, PNG, WebP, SVG)
- AI-powered image straightening and smart cropping
- Batch image processing with manual adjustment controls

## Quick Start

1. Clone & install:
```bash
git clone <repository-url>
cd canvas-mapper
npm install
```

2. Set up `.env.local`:
```bash
OPENAI_API_KEY=sk-proj-your-api-key-here
```

3. Run:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

Next.js 16 • React 19 • Tailwind CSS • Zustand • OpenAI GPT-4o • Sharp

## AI Features Usage

**Upload with processing**: Click "Add Piece" → select image (AI enabled by default) → review preview → adjust if needed → accept

**Batch processing**: Upload multiple images → click "Process N Images with AI" → review results
