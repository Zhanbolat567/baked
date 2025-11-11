/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_2GIS_API_KEY?: string;
  // добавьте другие env переменные здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
