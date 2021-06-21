declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
    INFURA_KOVAN_API_URL: string
  }
}