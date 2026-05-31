# Gallery Wall Planner - AI Migration Summary

## Project Overview
Canvas-mapper migrated from Vite to Next.js 14 with AI-powered image straightening and auto-cropping using GPT-4o Vision API.

## Tech Stack
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **React**: 19.1.0
- **Tailwind CSS**: 4.1.8
- **State**: Zustand
- **AI**: OpenAI GPT-4o (vision)
- **Image Processing**: Sharp (server), Canvas API (client)

## AI Features Implemented

### 1. Core AI Processing
- **Model**: GPT-4o (upgraded from deprecated gpt-4-vision-preview)
- **Endpoint**: `/api/process-image/route.ts`
- **Flow**: 
  1. Compress image to 1024px (Sharp)
  2. Send to GPT-4o for analysis
  3. Parse JSON response (strips markdown code blocks)
  4. Apply rotation + crop on client-side
  5. Save with metadata

### 2. UI Components
- **ImageProcessModal**: Before/after preview, manual controls, privacy disclaimer
- **BatchAIProcessModal**: Sequential batch processing with progress
- **RightPanel**: AI badges (🤖 AI ✓/✗), "Process with AI Now" button
- **Toolbar**: Batch button shows when unprocessedCount > 0

### 3. Processing Options
- **Default**: AI checkbox checked by default (opt-out)
- **Retroactive**: Process existing images via RightPanel button
- **Batch**: Process multiple unprocessed images sequentially
- **Manual**: Rotation (-45° to +45°) and crop bounds sliders

### 4. Validation & Safety
- **File Size**: 5MB limit
- **File Type**: Images only
- **Confidence Threshold**: 30% (below = use original)
- **Privacy**: Disclaimer about OpenAI data usage

## File Structure

```
app/
├── api/process-image/route.ts  # AI processing endpoint
├── layout.tsx                   # Root layout
├── page.tsx                     # Main page
└── providers.tsx                # Client providers

components/
├── BatchAIProcessModal.tsx      # Batch AI processing
├── ImageProcessModal.tsx        # Single AI processing UI
├── RightPanel.tsx               # Piece settings + AI badges
├── Toolbar.tsx                  # Batch button
└── WallCanvas.tsx               # Main canvas

lib/
├── aiImageProcessor.ts          # Client AI API caller
├── imageProcessingServer.ts     # Sharp compression
├── imageTransform.ts            # Client-side transforms
├── openai.ts                    # GPT-4o client
└── utils.ts                     # Utilities

store/
└── useStore.ts                  # Zustand store (AI metadata)

types/
└── index.ts                     # TypeScript defs (aiProcessed, etc.)
```

## Key Implementation Details

### OpenAI Integration (`lib/openai.ts`)
- Model: `gpt-4o` (has vision capabilities)
- Parses JSON response, strips markdown code blocks
- Returns: rotation (-45 to +45), bounds (x, y, w, h normalized), confidence (0-1)

### API Endpoint (`app/api/process-image/route.ts`)
- POST endpoint
- Compresses image to 1024px
- Calls GPT-4o for analysis
- Returns AI suggestions or falls back if confidence < 30%

### Client Processing (`lib/aiImageProcessor.ts`)
- Sends base64 image to API
- Returns AIProcessingResult with rotation, bounds, confidence

### Image Transformation (`lib/imageTransform.ts`)
- `applyRotation()`: Client-side canvas rotation
- `applyCrop()`: Client-side canvas cropping
- Preserves original quality (no server compression for final)

### Store Integration (`store/useStore.ts`)
- `setPieceImage()`: Accepts optional `aiData` parameter
- `reprocessPieceWithAI()`: Retroactive processing action
- `getUnprocessedPieceCount()`: Count for batch button visibility
- Stores: `aiProcessed: boolean`, `aiProcessingData?: AIProcessingData`

### Piece Interface (`types/index.ts`)
```typescript
interface Piece {
  // ... existing fields
  aiProcessed?: boolean
  aiProcessingData?: AIProcessingData
}

interface AIProcessingData {
  rotation: number
  bounds: { x: number; y: number; w: number; h: number }
  confidence: number
  timestamp: number
}
```

## Cost & Performance

- **Cost**: ~$0.02-0.03 per image (GPT-4o vision tokens)
- **Processing Time**: ~2-5 seconds per image
- **Batch**: Sequential to avoid rate limits
- **Compression**: 1024px for API (original quality for final)

## Environment Setup

```bash
# .env.local
OPENAI_API_KEY=sk-proj-...
```

## Migration Notes

### Removed (Vite)
- `vite.config.ts`
- `index.html`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `src/` directory

### Added (Next.js)
- `app/` directory structure
- `next.config.ts`
- `global.d.ts`
- `postcss.config.mjs`
- All components have `'use client'` directive

### Updated
- All imports use `@/` path alias
- `__GIT_HASH__` → `process.env.GIT_HASH`
- Removed webpack config (using Turbopack)

## Git Backup Tags
- `v0.1.0-vite`: Original Vite project
- `v0.2.0-before-nextjs-merge`: Before merging Next.js to main directory

## Known Issues & Fixes

### Fixed
1. ✅ GPT-4 Vision deprecated → Updated to `gpt-4o`
2. ✅ JSON wrapped in markdown → Added code block stripping
3. ✅ File size limit → Changed from 10MB to 5MB

### Monitoring
- OpenAI API rate limits (429 errors)
- Low confidence edge cases
- Large file processing times

## Testing Checklist
- [ ] Upload with AI enabled (default)
- [ ] Manual rotation/crop adjustments
- [ ] Retroactive processing (existing images)
- [ ] Batch processing (multiple images)
- [ ] File validation (5MB limit, image type)
- [ ] Confidence threshold (< 30% fallback)
- [ ] Error handling (API down, invalid response)

## Deployment (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Add `OPENAI_API_KEY` in Project Settings → Environment Variables
4. Deploy

## Future Enhancements
- [ ] Cost tracking dashboard
- [ ] AI confidence tuning slider
- [ ] Custom rotation range
- [ ] Background removal option
- [ ] Perspective correction
