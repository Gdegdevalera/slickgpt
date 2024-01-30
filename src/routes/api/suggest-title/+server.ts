import type {
	ChatCompletionMessageParam,
	ChatCompletionCreateParamsNonStreaming
} from 'openai/resources/chat';
import type { RequestHandler } from './$types';
import type { AiSettings } from '$misc/janai';
import { error } from '@sveltejs/kit';
import { getErrorMessage, respondToClient, throwIfUnset } from '$misc/error';
import { normalized } from '../shared';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const requestData = await request.json();
		throwIfUnset('request data', requestData);

		const messages: ChatCompletionMessageParam[] = requestData.messages;
		throwIfUnset('messages', messages);

		const settings: AiSettings = requestData.settings;
		throwIfUnset('settings', settings);

		const fixedMessages = [
			// take system, first user and first assisstant message into account
			...messages.slice(0, 3),
			{
				role: 'user',
				content:
					"Suggest a short title for this chat, summarising its content. Take the 'system' message into account and the first prompt from me and your first answer. The title should not be longer than 100 chars. Answer with just the title. Don't use punctuation is the title."
			} as ChatCompletionMessageParam
		];

		// const openAiKey: string = requestData.openAiKey;
		// throwIfUnset('OpenAI API key', openAiKey);

		const completionOpts: ChatCompletionCreateParamsNonStreaming = {
			...settings,
			messages: fixedMessages,
			stream: false
		};

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
		const result = await response.json();
		// strip leading and trailing quotes
		const title = result.choices[0].message.content.replace(/(^['"])|(['"]$)/g, '').trim();

		return respondToClient({ title });
	} catch (err) {
		throw error(500, getErrorMessage(err));
	}
};
