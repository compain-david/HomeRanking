/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_KEY?: string
  readonly VITE_HOUSEHOLD_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __BUILD__: string
