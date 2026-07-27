import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages sub-path: compain-david.github.io/HomeRanking/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/HomeRanking/' : '/',
})
