//@ts-check

/**
 * Converts a camelCase string to dash-case.
 *
 * @param {string} str
 * @returns {string}
 *
 */
function toDashCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * @typedef {{
 *  fetch?: (url: URL, options: RequestInit) => Promise<Response>,
 *  before?: (data: any) => any,
 *  after?: (data: any) => any,
 *  headers?: Record<string, string>,
 * }} MapperOptions
 */

/**
 * Creates a proxy object that maps object properties to HTTP requests. The
 * proxy object is a tree structure where each node is a path segment and each
 * leaf is a HTTP request method. There are some special properties that are
 * mapped to HTTP methods:
 *
 * - `get` - HTTP GET request
 * - `put` - HTTP PUT request
 * - `patch` - HTTP PATCH request
 * - `delete` - HTTP DELETE request
 * - `post` - HTTP POST request
 *
 * In case of the GET method, the query parameters are passed as an object to
 * the function. Other methods accept a single object as an argument, which is
 * sent as the request body (except for the DELETE method, which does not accept
 * any data).
 *
 * The proxy object can be used to access a JSON REST API endpoint. The base path is
 * specified as the first argument to the function. The second argument is an
 * optional object with the following properties:
 *
 * - `fetch` - a custom fetch implementation, defaults to `window.fetch`
 * - `before` - a function that pre-processes the request data
 * - `after` - a function that post-processes the response data
 * - `headers` - an object with additional headers to send with each request
 *
 * @param {string} basePath
 * @param {MapperOptions} options
 *
 * @returns
 */
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

/**
 * @param {URL} url
 * @param {'GET' | 'PUT' | 'PATCH' | 'DELETE' | 'POST'} method
 * @param {MapperOptions} options
 * @param {object} data
 * @returns
 */
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

async function example() {
    // Example usage:
    const api = createObjectMapper('https://example.org/base-path/', {
        // fetch: window.fetch,
        // alternative fetch implementation for testing purposes
        async fetch(url, { headers, method, body }) {
            console.log('[Debug] fetch', url.toString(), { headers, method, body })

            return new Response(JSON.stringify({ value: 'example data' }), {
                headers: { 'Content-Type': 'application/json' },
            })
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

// example()
