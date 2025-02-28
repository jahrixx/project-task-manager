// src/hooks.client.ts
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, event }) => {
    console.error('Client-side error:', error, event);
    // You could also send error logs to a remote service here.
    return {
        message: 'A client-side error occurred.',
    };
};