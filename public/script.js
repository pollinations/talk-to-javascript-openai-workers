
// Simple system prompt for HTML editing
const SYSTEM_PROMPT = `# Hello Pollinations - Voice HTML Editor

You are a voice-controlled HTML editor. You help users edit this single HTML page by modifying its content, styling, and structure.

## Your Role
Edit the current HTML page based on voice commands. You can change text, colors, layout, add elements, or modify styling.

## Communication Style
- Speak naturally and briefly
- Explain what you changed
- Always speak in English

## Available Tools
- **getPageHTML**: See the current HTML structure and content
- **setText**: Change text content of any element using CSS selectors
- **setStyle**: Modify CSS styling of any element using CSS selectors
- **editPageHTML**: Replace the entire HTML content

## Example Commands
- "What's on the page?" → Uses getPageHTML to see current content
- "Change the title to Welcome" → Uses setText with selector "h1"
- "Make the background red" → Uses setStyle with selector ":host"
- "Add a button" → Uses editPageHTML to add new content
- "Make the text bigger" → Uses setStyle to increase font size

## Guidelines
- Keep changes simple and clean
- Maintain good HTML structure
- Use inline CSS for styling changes
- Make the page look good and functional`;

// Shadow DOM Custom Element
class AISandbox extends HTMLElement {
	constructor() {
		super();
		this.root = this.attachShadow({ mode: 'open' });
		this.initializeContent();
		this.setupStyles();
	}

	initializeContent() {
		this.root.innerHTML = `
			<div class="container">
				<div class="emoji">🌸</div>
				<h1 id="title">Hello Pollinations</h1>
				<p>Welcome to your voice-controlled web page! Say something like "change the title to Welcome" or "make the background red" to edit this page.</p>
			</div>
		`;
	}

	setupStyles() {
		this.styleElement = document.createElement('style');
		this.defaultStyles = `
			:host {
				display: block;
				font-family: Arial, sans-serif;
				margin: 0;
				padding: 40px;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				min-height: 100vh;
				box-sizing: border-box;
			}
			.container {
				background: white;
				padding: 60px;
				border-radius: 20px;
				box-shadow: 0 20px 40px rgba(0,0,0,0.1);
				text-align: center;
				max-width: 600px;
				margin: 0 auto;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				min-height: calc(100vh - 80px);
			}
			h1 {
				color: #333;
				font-size: 3em;
				margin-bottom: 20px;
				background: linear-gradient(45deg, #667eea, #764ba2);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
			}
			p {
				color: #666;
				font-size: 1.2em;
				line-height: 1.6;
				margin-bottom: 30px;
			}
			.emoji {
				font-size: 4em;
				margin-bottom: 20px;
			}
		`;
		this.styleElement.textContent = this.defaultStyles;
		this.root.appendChild(this.styleElement);
	}

	updateStyles(newCSS) {
		// Merge new CSS with default styles
		this.styleElement.textContent = this.defaultStyles + '\n' + newCSS;
	}

	// Clean DOM editing - only handles HTML content
	replaceHTML(html) {
		const container = this.root.querySelector('.container');
		if (container) {
			container.innerHTML = html;
		}
	}

	// Dedicated JavaScript execution
	addScript(jsCode, scriptId = null) {
		const container = this.root.querySelector('.container');
		if (container) {
			// Remove existing script with same ID if provided
			if (scriptId) {
				const existingScript = container.querySelector(`script[data-script-id="${scriptId}"]`);
				if (existingScript) {
					existingScript.remove();
				}
			}
			
			// Create and execute new script
			const script = document.createElement('script');
			if (scriptId) {
				script.setAttribute('data-script-id', scriptId);
			}
			script.textContent = jsCode;
			container.appendChild(script);
			return true;
		}
		return false;
	}

	// Parse full HTML document and separate concerns
	parseFullHTML(html) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		
		// Extract styles
		const styles = doc.querySelectorAll('style');
		let extractedCSS = '';
		styles.forEach(style => {
			extractedCSS += style.textContent + '\n';
		});
		
		// Extract scripts
		const scripts = doc.querySelectorAll('script');
		const extractedJS = Array.from(scripts).map(script => script.textContent).join('\n');
		
		// Extract body content (without scripts)
		const bodyClone = doc.body ? doc.body.cloneNode(true) : document.createElement('body');
		bodyClone.querySelectorAll('script').forEach(script => script.remove());
		
		return {
			css: extractedCSS.trim(),
			js: extractedJS.trim(),
			html: bodyClone.innerHTML
		};
	}

	setText(selector, text) {
		console.log(`setText called: selector="${selector}", text="${text}"`);
		const element = this.root.querySelector(selector);
		if (element) {
			element.textContent = text;
			console.log(`Text updated for element:`, element);
			// Special case: if targeting title, also update document title
			if (selector === 'h1' || selector === '#title') {
				document.title = text;
			}
			return true;
		}
		console.log(`Element not found for selector: ${selector}`);
		return false;
	}

	setStyle(selector, property, value) {
		console.log(`setStyle called: selector="${selector}", property="${property}", value="${value}"`);
		
		// Handle :host selector specially - it refers to the custom element itself
		if (selector === ':host') {
			this.style[property] = value;
			console.log('Applied style to :host element');
			return true;
		}
		
		const element = this.root.querySelector(selector);
		if (element) {
			element.style[property] = value;
			console.log(`Applied style to element:`, element);
			return true;
		}
		console.log(`Element not found for selector: ${selector}`);
		return false;
	}

	getDOM() {
		return this.root.innerHTML;
	}
}

// Register custom element
customElements.define('ai-sandbox', AISandbox);

// Helper functions to access Shadow DOM
const getSandbox = () => document.querySelector('ai-sandbox');
const getSandboxRoot = () => getSandbox()?.shadowRoot;

// Generic voice tools for Shadow DOM
const fns = {
	getPageHTML: () => {
		console.log('getPageHTML called');
		const sandbox = getSandbox();
		if (sandbox) {
			const html = sandbox.getDOM();
			console.log('Retrieved HTML:', html);
			return { success: true, html };
		}
		console.log('AI Sandbox not found');
		return { success: false, error: 'AI Sandbox not found' };
	},
	editPageHTML: ({ html }) => {
		console.log('editPageHTML called with:', html);
		const sandbox = getSandbox();
		if (sandbox) {
			// Check if this is a full HTML document or just content
			if (html.includes('<!DOCTYPE') || html.includes('<html')) {
				// Parse full HTML document and handle each part separately
				const parsed = sandbox.parseFullHTML(html);
				
				// Update styles if found
				if (parsed.css) {
					sandbox.updateStyles(parsed.css);
				}
				
				// Update HTML content
				sandbox.replaceHTML(parsed.html);
				
				// Execute JavaScript if found
				if (parsed.js) {
					sandbox.addScript(parsed.js, 'page-script');
				}
			} else {
				// Just content - use as is
				sandbox.replaceHTML(html);
			}
			return { success: true, message: 'Page HTML updated' };
		}
		return { success: false, error: 'AI Sandbox not found' };
	},
	addScript: ({ jsCode, scriptId }) => {
		console.log('addScript function called with:', { jsCode: jsCode?.substring(0, 100) + '...', scriptId });
		const sandbox = getSandbox();
		if (sandbox) {
			const success = sandbox.addScript(jsCode, scriptId);
			if (success) {
				return { success: true, scriptId, message: 'JavaScript executed successfully' };
			}
			return { success: false, error: 'Failed to execute JavaScript' };
		}
		return { success: false, error: 'AI Sandbox not found' };
	},
	setText: ({ selector, text }) => {
		console.log('setText function called with:', { selector, text });
		const sandbox = getSandbox();
		if (sandbox) {
			const success = sandbox.setText(selector, text);
			if (success) {
				return { success: true, selector, text, message: 'Text updated successfully' };
			}
			return { success: false, error: `Element not found for selector: ${selector}` };
		}
		return { success: false, error: 'AI Sandbox not found' };
	},
	setStyle: ({ selector, property, value }) => {
		console.log('setStyle function called with:', { selector, property, value });
		const sandbox = getSandbox();
		if (sandbox) {
			const success = sandbox.setStyle(selector, property, value);
			if (success) {
				return { success: true, selector, property, value, message: 'Style updated successfully' };
			}
			return { success: false, error: `Element not found for selector: ${selector}` };
		}
		return { success: false, error: 'AI Sandbox not found' };
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
			instructions: SYSTEM_PROMPT,
			modalities: ['text', 'audio'],
			tools: [
				{
					type: 'function',
					name: 'getPageHTML',
					description: 'Get the current HTML content of the page to see what elements exist',
					parameters: {
						type: 'object',
						properties: {},
					},
				},
				{
					type: 'function',
					name: 'setText',
					description: 'Change text content of any element using CSS selector',
					parameters: {
						type: 'object',
						properties: {
							selector: { type: 'string', description: 'CSS selector for the element (e.g., "h1", "p", ".container", "#title")' },
							text: { type: 'string', description: 'New text content' },
						},
						required: ['selector', 'text'],
					},
				},
				{
					type: 'function',
					name: 'setStyle',
					description: 'Change CSS styling of any element using CSS selector',
					parameters: {
						type: 'object',
						properties: {
							selector: { type: 'string', description: 'CSS selector for the element (e.g., ":host", ".container", "h1")' },
							property: { type: 'string', description: 'CSS property name (e.g., "backgroundColor", "fontSize", "color")' },
							value: { type: 'string', description: 'CSS property value (e.g., "red", "24px", "#333")' },
						},
						required: ['selector', 'property', 'value'],
					},
				},
				{
					type: 'function',
					name: 'editPageHTML',
					description: 'Replace the entire HTML content of the page',
					parameters: {
						type: 'object',
						properties: {
							html: { type: 'string', description: 'Complete HTML content for the page' },
						},
						required: ['html'],
					},
				},
				{
					type: 'function',
					name: 'addScript',
					description: 'Execute JavaScript code in the page context',
					parameters: {
						type: 'object',
						properties: {
							jsCode: { type: 'string', description: 'JavaScript code to execute' },
							scriptId: { type: 'string', description: 'Optional ID to replace existing script with same ID' },
						},
						required: ['jsCode'],
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

