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

const corsHeaders = {
	'Access-Control-Allow-Origin': 'https://stockpredictions.simonyuen.me',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

interface Env {
	POLYGON_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		const ticker = url.searchParams.get('ticker');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		if (!ticker || !startDate || !endDate) {
			return new Response('Missing required parameters', {
				status: 400,
				headers: corsHeaders,
			});
		}

		const polygonURL = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`;
		try {
			const polygonResponse = await fetch(`${polygonURL}?apiKey=${env.POLYGON_API_KEY}`);
			if (!polygonResponse.ok) {
				throw new Error('Failed to fetch data from Polygon API.');
			}
			// Parse response body as JSON and remove `request_id` for AI Gateway caching
			const data = (await polygonResponse.json()) as any;
			delete data.request_id;

			return new Response(JSON.stringify(data), { headers: corsHeaders });
		} catch (e: any) {
			return new Response(e.message, { status: 500, headers: corsHeaders });
		}
	},
};
