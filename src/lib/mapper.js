function toDashCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function createObjectMapper(basePath, options = {}) {
    const handler = {
        get({ path }, prop) {
            const url = new URL(`${basePath.replace(/\/$/, '')}/${path.join('/')}`)

            if (prop === 'get') {
                return async (query = {}) => {
                    Object.entries(query).forEach(([key, value]) =>
                        url.searchParams.append(toDashCase(key), value)
                    )

                    return processRequest(url, 'GET', options)
                }
            } else if (prop === 'put') {
                return async data => {
                    return processRequest(url, 'PUT', options, data)
                }
            } else if (prop === 'patch') {
                return async data => {
                    return processRequest(url, 'PATCH', options, data)
                }
            } else if (prop === 'delete') {
                return async () => {
                    return processRequest(url, 'DELETE', options)
                }
            } else if (prop === 'post') {
                return async data => {
                    return processRequest(url, 'POST', options, data)
                }
            } else {
                return createProxy([...path, prop])
            }
        },
    }

    function createProxy(path = []) {
        return new Proxy({ path }, handler)
    }

    return createProxy()
}

async function processRequest(url, method, options = {}, data = null) {
    const requestData = options.before?.(data) ?? data

    const fetchFn = options.fetch ?? window.fetch

    const response = await fetchFn(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        body: JSON.stringify(requestData),
    })

    const responseData = await response.json()

    return options.after?.(responseData) ?? responseData
}

async function main() {
    // Example usage:
    const api = createObjectMapper('https://example.org/base-path/', {
        // fetch: window.fetch,
        async fetch(url, { headers, method, body }) {
            console.log('[Debug] fetch', url.toString(), { headers, method, body })

            return {
                json: async () => ({
                    value: 'example data',
                }),
            }
        },
        before: data => ({ ...data, timestamp: Date.now() }),
        // after: data => ({ ...data,  }),
        headers: {
            ['Authorization']: 'Bearer 1234567890',
        },
    })

    await api.users['user-id-1'].get()

    await api.posts.post({
        title: 'New Post',
        content: 'Lorem ipsum',
    })

    await api.posts.get({
        category: 'technology',
        limit: 5,
    })

    await api.posts['post-id-123'].comments.get({
        commentId: 'comment-456',
    })

    await api.users['user-id-1'].put({ fullName: 'John Doe' })
}

main()
