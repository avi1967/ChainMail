/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANISTER_ID_CHAINMAIL: string
  readonly VITE_DFX_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
