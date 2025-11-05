// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The Google Gemini API Key. */
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}