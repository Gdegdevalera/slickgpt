import type {
	ChatCompletionMessageParam,
	ChatCompletionCreateParamsStreaming
} from 'openai/resources/chat';
import type { RequestHandler } from './$types';
import type { AiSettings } from '$misc/janai';
import { error } from '@sveltejs/kit';
import { getErrorMessage, throwIfUnset } from '$misc/error';
import { normalized } from '../shared';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const requestData = await request.json();
		throwIfUnset('request data', requestData);

		const messages: ChatCompletionMessageParam[] = requestData.messages;
		throwIfUnset('messages', messages);

		const settings: AiSettings = requestData.settings;
		throwIfUnset('settings', settings);

		//const openAiKey: string = requestData.openAiKey;
		//throwIfUnset('OpenAI API key', openAiKey);

		const completionOpts: ChatCompletionCreateParamsStreaming = {
			messages,
			...settings,
			stream: true
		};

		// We'll disable the old API for now as it handles stuff quite differently..
		// OpenAI will probably make old models available for the new API soon.
		//
		// const apiUrl =
		// 	settings.model === OpenAiModel.Gpt35Turbo
		// 		? 'https://api.openai.com/v1/chat/completions'
		// 		: 'https://api.openai.com/v1/completions';

		const apiBaseUrl: string = process.env['APIURL'] ?? '';
		throwIfUnset('AI API URL', apiBaseUrl);

		const requestUrl = normalized(apiBaseUrl) + 'v1/chat/completions';

		const response = await fetch(requestUrl, {
			headers: {
				//Authorization: `Bearer ${openAiKey}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(completionOpts)
		});

		if (!response.ok) {
			const err = await response.json();
			throw err.error;
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		});
	} catch (err) {
		throw error(500, getErrorMessage(err));
	}
};
