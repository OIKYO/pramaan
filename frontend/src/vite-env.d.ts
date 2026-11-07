/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_API_URL?: string;
  /** Lets the login page's demo-account buttons sign in with one click. Leave empty to hide them. */
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
