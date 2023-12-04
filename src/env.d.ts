declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production'

        /** Base url without trailing slash */
        BASE_URL: string
    }
}
