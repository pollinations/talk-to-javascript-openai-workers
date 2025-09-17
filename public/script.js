// System prompt for the AI assistant
const systemPrompt = `# Voice-Controlled Web Page Builder

You are a voice-controlled assistant that builds and modifies web pages in real-time through JavaScript execution. You create complete, interactive web experiences by manipulating the DOM directly.

## Your Approach

Follow the Plain Vanilla Web philosophy:
- No build tools, no frameworks - just HTML, CSS, JavaScript
- Browser-native technologies only
- Everything created through direct DOM manipulation
- Modern, clean, responsive design

## Available Function

**executeJS(js)** - Execute JavaScript code to build/modify the page

## Implementation Patterns

### HTML Structure
- Use document.createElement() to build semantic HTML
- Create proper document structure with containers, sections, headers
- Build incrementally so users see progress

### CSS Styling
- Use element.style for direct styling or createElement('style') for CSS blocks
- Leverage CSS variables (--var) for theming
- Component-scoped selectors with classes
- Modern CSS: flexbox, grid, custom properties
- Responsive design with media queries

### JavaScript Functionality  
- Web Components (class extends HTMLElement) for complex widgets
- Event listeners for interactivity
- Use connectedCallback for component initialization
- ES6+ features: arrow functions, destructuring, modules

### External Resources
- Images: "https://image.pollinations.ai/prompt/[urlencoded prompt]?width=[width]&height=[height]"
- CDN imports for external libraries if needed
- Relative links for navigation (no leading slash)

## Code Style
- Write elegant, concise code like a demoscene challenge
- Incremental rendering - build UI progressively
- Target modern browsers
- Clean, readable, maintainable code

## Examples

Create a button:
\`const btn = document.createElement('button'); btn.textContent = 'Click me'; btn.onclick = () => alert('Hello'); document.body.appendChild(btn);\`

Add styles:
\`const style = document.createElement('style'); style.textContent = 'body { font-family: Arial; background: linear-gradient(45deg, #667eea, #764ba2); }'; document.head.appendChild(style);\`

Build a component:
\`class MyWidget extends HTMLElement { connectedCallback() { this.innerHTML = '<div>Custom Widget</div>'; } } customElements.define('my-widget', MyWidget); document.body.appendChild(document.createElement('my-widget'));\`

Create images with Pollinations.ai:
\`const img = document.createElement('img'); img.src = 'https://image.pollinations.ai/prompt/beautiful%20sunset%20over%20mountains?width=800&height=400'; img.style.width = '100%'; document.body.appendChild(img);\`

## Guidelines
- Always execute complete, working code
- Build beautiful, modern interfaces
- Make everything interactive and engaging
- Use semantic HTML structure
- Implement proper error handling
- Create responsive layouts that work on all devices`;

// Initialize the page with minimal structure
function initializePage() {
	document.body.innerHTML = `
		<h1 id="title">Voice Interface</h1>
		<div id="content">
			<p>Ready for voice commands.</p>
		</div>
	`;
}

// Simple JavaScript execution function
function executeJS(js) {
	console.log('executeJS called with:', js);
	try {
		// Execute the JavaScript directly in the DOM context
		eval(js);
		// Return success with current DOM state
		return { 
			success: true, 
			message: 'JavaScript executed successfully',
			currentDOM: document.body.innerHTML
		};
	} catch (error) {
		console.error('JavaScript execution error:', error);
		return { 
			success: false, 
			error: error.message,
			currentDOM: document.body.innerHTML
		};
	}
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', initializePage);

// Simple voice tools interface with just executeJS
const fns = {
	executeJS: ({ js }) => {
		return executeJS(js);
	}
};

// Create a WebRTC Agent
const peerConnection = new RTCPeerConnection();

// On inbound audio add to page
peerConnection.ontrack = (event) => {
	const el = document.createElement('audio');
	el.srcObject = event.streams[0];
	el.autoplay = el.controls = true;
	el.style.display = 'none'; // Hide audio controls
	document.body.appendChild(el);
};

const dataChannel = peerConnection.createDataChannel('oai-events');

function configureData() {
	console.log('Configuring data channel');
	const event = {
		type: 'session.update',
		session: {
			instructions: systemPrompt,
			modalities: ['text', 'audio'],
			tools: [
				{
					type: 'function',
					name: 'executeJS',
					description: 'Execute arbitrary JavaScript code to manipulate the page',
					parameters: {
						type: 'object',
						properties: {
							js: { type: 'string', description: 'JavaScript code to execute. You can modify DOM, add styles, create elements, add event listeners, etc. (e.g., "document.getElementById(\'title\').textContent = \'New Title\'", "const btn = document.createElement(\'button\'); btn.textContent = \'Click me\'; btn.onclick = () => alert(\'Hello\'); document.getElementById(\'content\').appendChild(btn);")' },
						},
						required: ['js'],
					},
				},
			],
		},
	};
	dataChannel.send(JSON.stringify(event));
}

dataChannel.addEventListener('open', (ev) => {
	console.log('Opening data channel', ev);
	configureData();
});

// {
//     "type": "response.function_call_arguments.done",
//     "event_id": "event_Ad2gt864G595umbCs2aF9",
//     "response_id": "resp_Ad2griUWUjsyeLyAVtTtt",
//     "item_id": "item_Ad2gsxA84w9GgEvFwW1Ex",
//     "output_index": 1,
//     "call_id": "call_PG12S5ER7l7HrvZz",
//     "name": "get_weather",
//     "arguments": "{\"location\":\"Portland, Oregon\"}"
// }

dataChannel.addEventListener('message', async (ev) => {
	const msg = JSON.parse(ev.data);
	// Handle function calls
	if (msg.type === 'response.function_call_arguments.done') {
		const fn = fns[msg.name];
		if (fn !== undefined) {
			console.log(`Calling local function ${msg.name} with ${msg.arguments}`);
			const args = JSON.parse(msg.arguments);
			const result = await fn(args);
			console.log('result', result);
			// Let OpenAI know that the function has been called and share it's output
			const event = {
				type: 'conversation.item.create',
				item: {
					type: 'function_call_output',
					call_id: msg.call_id, // call_id from the function_call message
					output: JSON.stringify(result), // result of the function
				},
			};
			dataChannel.send(JSON.stringify(event));
			// Have assistant respond after getting the results
			dataChannel.send(JSON.stringify({type:"response.create"}));
		}
	}
});

// Capture microphone
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
	// Add microphone to PeerConnection
	stream.getTracks().forEach((track) => peerConnection.addTransceiver(track, { direction: 'sendrecv' }));

	peerConnection.createOffer().then((offer) => {
		peerConnection.setLocalDescription(offer);
		fetch('/session')
			.then((tokenResponse) => tokenResponse.json())
			.then((data) => {
				const EPHEMERAL_KEY = data.result.client_secret.value;
				const baseUrl = 'https://api.openai.com/v1/realtime';
				const model = 'gpt-realtime';
				fetch(`${baseUrl}?model=${model}`, {
					method: 'POST',
					body: offer.sdp,
					headers: {
						Authorization: `Bearer ${EPHEMERAL_KEY}`,
						'Content-Type': 'application/sdp',
					},
				})
					.then((r) => r.text())
					.then((answer) => {
						// Accept answer from Realtime WebRTC API
						peerConnection.setRemoteDescription({
							sdp: answer,
							type: 'answer',
						});
					});
			});

		// Send WebRTC Offer to Workers Realtime WebRTC API Relay
	});
});

