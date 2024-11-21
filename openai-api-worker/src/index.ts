/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from 'openai';

interface Env {
	OPENAI_API_KEY: string;
}

const corsHeaders = {
	'Access-Control-Allow-Origin': 'https://stockpredictions.simonyuen.me',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default {
	async fetch(request, env: Env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.` }), { status: 405, headers: corsHeaders });
		}

		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: 'https://gateway.ai.cloudflare.com/v1/26495a9dafad0f2a39db9ba040bd03ea/stock-predictions/openai',
		});
		try {
			const messages = (await request.json()) as OpenAI.Chat.ChatCompletionMessageParam[];

			const chatCompletion = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: messages,
				temperature: 1.1,
				max_tokens: 350,
				presence_penalty: 0,
				frequency_penalty: 0,
			});
			const response = chatCompletion.choices[0].message;

			return new Response(JSON.stringify(response), { headers: corsHeaders });
		} catch (e: any) {
			return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		}
	},
} satisfies ExportedHandler<Env>;
