import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

// Get git commit hash - works locally and on Vercel
function getGitHash() {
  try {
    // Vercel provides VERCEL_GIT_COMMIT_SHA
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    }
    // Local git
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __GIT_HASH__: JSON.stringify(getGitHash()),
  },
})
