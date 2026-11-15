import { getApiUrl } from './config.js';

export async function api(method, route, { token, body, query } = {}) {
    const url = new URL(route, await getApiUrl());

    if (query) {
        for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    }

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data.message || `Request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }

    return data;
}
