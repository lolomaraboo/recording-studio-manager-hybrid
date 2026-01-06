/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SUPERADMIN_EMAIL: string
  readonly VITE_SENTRY_DSN_FRONTEND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
