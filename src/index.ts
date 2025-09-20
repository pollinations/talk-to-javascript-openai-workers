import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env }>();
app.use(cors());

// OpenAI Realtime API session endpoint
app.get('/session', async (c) => {
	try {
		// Check if API key exists
		if (!c.env.OPENAI_API_KEY) {
			console.error('❌ OPENAI_API_KEY not found in environment');
			return c.json({ error: { message: 'OPENAI_API_KEY not configured' } }, 500);
		}

		console.log('🔑 Making request to OpenAI with API key present:', !!c.env.OPENAI_API_KEY);
		
		const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
			method: "POST",
			headers: {
			  "Authorization": `Bearer ${c.env.OPENAI_API_KEY}`,
			  "Content-Type": "application/json",
			},
			body: JSON.stringify({
			  model: "gpt-realtime",
			  voice: "cedar",
			}),
		});

		console.log('📡 OpenAI API response status:', response.status);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ OpenAI API error:', response.status, errorText);
			return c.json({ 
				error: { 
					message: `OpenAI API error: ${response.status}`,
					details: errorText 
				} 
			}, 500);
		}

		const result = await response.json() as any;
		console.log('✅ OpenAI API success:', result);
		return c.json(result);
		
	} catch (error) {
		console.error('💥 Session endpoint error:', error);
		return c.json({ 
			error: { 
				message: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			} 
		}, 500);
	}
});

export default app;
