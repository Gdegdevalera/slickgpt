import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getErrorMessage, throwIfUnset } from '$misc/error';
import { normalized } from '../shared';

export const GET: RequestHandler = async ({ request, fetch }) => {
	try {
		const apiBaseUrl: string = process.env['APIURL'] ?? '';
		throwIfUnset('AI API URL', apiBaseUrl);

		const requestUrl = normalized(apiBaseUrl) + 'v1/models';

		const response = await fetch(requestUrl, {
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'GET'
		});

		if (!response.ok) {
			const err = await response.json();
			throw err.error;
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (err) {
		throw error(500, getErrorMessage(err));
	}
};
