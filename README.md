# Gallery Wall Planner

A browser-based gallery wall planner with AI-powered image straightening and auto-cropping.

## Features

### Core Functionality
- **Interactive Canvas**: Drag, drop, and arrange pieces on a virtual wall
- **Flexible Measurements**: Support for inches, centimeters, and millimeters
- **Multiple Patterns**: Pre-built arrangements (shelf, cross, diagonal, grid, scattered)
- **Undo/Redo**: Full history tracking with labeled actions
- **Export/Import**: Save and load layouts as JSON
- **Image Export**: Export wall layouts as PNG, WebP, or SVG

### AI Image Processing (GPT-4 Vision)
- **Auto-Straighten**: Automatically detect and correct image rotation
- **Smart Cropping**: Remove excess background/margins around artwork
- **Manual Adjustments**: Fine-tune AI suggestions with rotation and crop sliders
- **Batch Processing**: Process multiple images sequentially
- **Retroactive Processing**: Apply AI to previously uploaded images
- **Confidence Threshold**: Only applies corrections above 30% confidence
- **File Validation**: 5MB size limit, image files only

## Getting Started

### Prerequisites
- Node.js 18+ 
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd canvas-mapper
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file with your OpenAI API key:
```bash
OPENAI_API_KEY=sk-proj-your-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **UI**: React 19.1.0, Tailwind CSS 4.1.8
- **State Management**: Zustand
- **AI**: OpenAI GPT-4o (vision capabilities)
- **Image Processing**: Sharp (server-side), Canvas API (client-side)
- **Icons**: Font Awesome
- **Notifications**: React Hot Toast

## Project Structure

```
canvas-mapper/
├── app/
│   ├── api/process-image/    # AI processing endpoint
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main page
│   └── providers.tsx          # Client-side providers
├── components/                # React components
│   ├── BatchAIProcessModal.tsx
│   ├── ImageProcessModal.tsx
│   ├── RightPanel.tsx
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   ├── WallCanvas.tsx
│   └── ...
├── lib/                       # Utilities & helpers
│   ├── aiImageProcessor.ts    # AI client
│   ├── imageTransform.ts      # Image transformations
│   ├── openai.ts              # OpenAI client
│   ├── utils.ts               # General utilities
│   └── ...
├── store/                     # Zustand state management
│   └── useStore.ts
├── types/                     # TypeScript definitions
│   └── index.ts
└── public/                    # Static assets
```

## AI Features Usage

### Upload with AI Processing (Default)
1. Click "Add Piece" in the sidebar
2. Select an image (AI checkbox is checked by default)
3. Review before/after preview
4. Adjust rotation/crop if needed
5. Click "Accept" to apply

### Retroactive Processing
1. Upload images without AI processing (uncheck AI checkbox)
2. Click "Process with AI Now" button in piece settings
3. Review and accept/reject changes

### Batch Processing
1. Upload multiple images without AI
2. Click "🤖 Process N Images with AI" in toolbar
3. Wait for sequential processing
4. Review results for each piece

## Cost Estimate

- **Model**: GPT-4o (vision)
- **Cost per image**: ~$0.02-0.03 USD
- **100 images/month**: ~$2-3 USD
- **1,000 images/month**: ~$20-30 USD

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI image processing |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.
