declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production'

        /** Base URL without trailing slash */
        BASE_URL: string

        /** Planimetrie API URL without trailing slash */
        PLANIMETRIE_API_URL: string
    }
}
