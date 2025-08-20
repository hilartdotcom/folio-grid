// postcss.config.mjs - ESM PostCSS config for Vite
import tailwind from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [tailwind(), autoprefixer()],
}