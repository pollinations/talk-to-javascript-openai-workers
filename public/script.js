// System prompt for the AI assistant
const systemPrompt = `# Voice-Controlled Web Page Builder

You are a voice-controlled assistant that builds and modifies web pages in real-time through JavaScript execution. You create complete, interactive web experiences by manipulating the DOM directly.

## Your Approach

Follow the Plain Vanilla Web philosophy:
- No build tools, no frameworks - just HTML, CSS, JavaScript
- Browser-native technologies only
- Everything created through direct DOM manipulation
- Modern, clean, responsive design

## Available Functions

**executeJS({js})** - Execute JavaScript code to build/modify the page. Returns the updated DOM state after execution, allowing you to see the current page structure.

**captureScreenshot({message})** - Capture a screenshot of the current page and send it for visual analysis. Automatically optimizes resolution and file size for GPT-realtime API.

## Pre-loaded Libraries

The following libraries are already loaded and ready to use:

### 3D Graphics & WebGL
- **THREE** (Three.js v0.169.0) - 3D graphics, WebGL, OrbitControls available
- **AFRAME** (A-Frame v1.7.1) - VR/AR web experiences with HTML

### Animation Libraries  
- **gsap** (GSAP v3.12.5) - Professional animations, timelines, ScrollTrigger
- **anime** (Anime.js v3.2.2) - Lightweight animations
- **lottie** (Lottie Web v5.12.2) - After Effects animations

### Data Visualization
- **Chart** (Chart.js v4.5.0) - Simple charts (bar, line, pie, etc.)
- **d3** (D3.js v7.9.0) - Advanced data visualization and DOM manipulation

### Creative Coding
- **p5** (p5.js v1.9.4) - Creative coding, generative art, sketches
- **fabric** (Fabric.js v6.4.2) - Interactive canvas objects

### UI & Interaction
- **Hammer** (Hammer.js v2.0.8) - Touch gestures and mobile interactions
- **Sortable** (Sortable.js v1.15.2) - Drag and drop functionality

### Audio/Video
- **Howl** (Howler.js v2.2.4) - Web audio, sound effects, music
- **videojs** (Video.js v8.12.0) - HTML5 video player

### Utilities
- **_** (Lodash v4.17.21) - Utility functions for arrays, objects, etc.
- **moment** (Moment.js v2.30.1) - Date/time manipulation and formatting

## Execution Strategy

### Coherent Block Chunking
- Break complex tasks into logical, coherent blocks (not line-by-line)
- Each executeJS call should accomplish a complete sub-task

### Execution Order
- **Always create elements before referencing them**
- Create parent containers before child elements
- Define styles before applying them to elements
- Set up variables and functions before using them

### Variable Persistence - CRITICAL
- **Save ALL variables, elements, and functions to window for later use**
- Use \`window.variableName = value;\` instead of \`const variableName = value;\`
- Examples:
  - Elements: \`window.myButton = document.createElement('button');\`
  - Functions: \`window.updateCounter = () => { count++; };\`
  - Data: \`window.gameState = { score: 0, level: 1 };\`
- **Always assign IDs**: \`element.id = 'uniqueId';\` for DOM access backup

## String Escaping Guidelines

### Template Literals (Preferred)
- Use backticks for complex strings: \`const html = \\\`<div class="container">\\\`;\`
- Template literals handle quotes naturally: \`element.innerHTML = \\\`<p>Say "hello" to the world</p>\\\`;\`

### Quote Management
- Outer single quotes, inner double quotes: \`element.className = 'btn btn-primary';\`
- For nested quotes: \`element.onclick = () => alert('Hello "World"!');\`
- Escape when needed: \`element.textContent = 'Don\\'t forget to save';\`

### JSON and Complex Data
- Use template literals for JSON: \`const data = \\\`{"name": "value", "nested": {"key": "data"}}\\\`;\`
- Avoid deep nesting in single calls - break into chunks instead

## Implementation Patterns

### HTML Structure
- Use document.createElement() to build semantic HTML
- Always assign IDs: \`container.id = 'mainContainer';\`
- Build incrementally so users see progress

### CSS Styling
- Use element.style for direct styling or createElement('style') for CSS blocks
- Modern CSS: flexbox, grid, custom properties

### JavaScript Functionality  
- Web Components (class extends HTMLElement) for complex widgets
- Event listeners for interactivity
- Use connectedCallback for component initialization
- ES6+ features: arrow functions, destructuring, modules

### External Resources
- Images: "https://image.pollinations.ai/prompt/[urlencoded prompt]?width=[width]&height=[height]"
- CDN imports for external libraries if needed
- Relative links for navigation (no leading slash)

## Guidelines
- Always execute complete, working code
- Build beautiful, modern interfaces
- Make everything interactive and engaging
- Use semantic HTML structure
- Implement proper error handling
- Create responsive layouts that work on all devices
- **Remember: Create before reference, assign IDs, use coherent chunks**`;

// Initialize the page functionality (don't overwrite HTML content)
function initializePage() {
	// Set up button event listeners
	const startButton = document.getElementById('startButton');
	
	if (startButton) {
		startButton.addEventListener('click', toggleAIConversation);
	}
	
	// Log which libraries are available
	console.log('Libraries loaded from HTML:', {
		'Three.js': typeof THREE !== 'undefined',
		'A-Frame': typeof AFRAME !== 'undefined',
		'GSAP': typeof gsap !== 'undefined',
		'Anime.js': typeof anime !== 'undefined',
		'Lottie': typeof lottie !== 'undefined',
		'Chart.js': typeof Chart !== 'undefined',
		'D3.js': typeof d3 !== 'undefined',
		'p5.js': typeof p5 !== 'undefined',
		'Fabric.js': typeof fabric !== 'undefined',
		'Hammer.js': typeof Hammer !== 'undefined',
		'Sortable.js': typeof Sortable !== 'undefined',
		'Howler.js': typeof Howl !== 'undefined',
		'Video.js': typeof videojs !== 'undefined',
		'Lodash': typeof _ !== 'undefined',
		'Moment.js': typeof moment !== 'undefined'
	});
}

// Error collection system for AI feedback
let recentErrors = [];
let errorCollectionTimeout = null;

// Intercept console.error to collect errors for AI feedback
const originalConsoleError = console.error;
console.error = function(...args) {
	// Call original console.error
	originalConsoleError.apply(console, args);
	
	// Collect error for AI feedback
	const errorMessage = args.map(arg => 
		typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
	).join(' ');
	
	recentErrors.push({
		timestamp: Date.now(),
		message: errorMessage,
		stack: args[0]?.stack || null
	});
	
	// Keep only last 5 errors and errors from last 30 seconds
	const now = Date.now();
	recentErrors = recentErrors
		.filter(err => now - err.timestamp < 30000)
		.slice(-5);
};

// Simple JavaScript execution function
function executeJS(js) {
	console.log('executeJS called with:', js);
	
	// Clear recent errors before execution
	recentErrors = [];
	
	try {
		// Execute the JavaScript directly in the DOM context
		eval(js);
		
		// Wait longer to collect async errors from component initialization
		return new Promise(resolve => {
			setTimeout(() => {
				const result = {
					success: true,
					message: 'JavaScript executed successfully',
					currentDOM: document.body.innerHTML
				};
				
				// Include any errors that occurred during or after execution
				if (recentErrors.length > 0) {
					result.runtimeErrors = recentErrors.map(err => ({
						message: err.message,
						timestamp: err.timestamp,
						stack: err.stack
					}));
					result.message += ` (${recentErrors.length} runtime error(s) detected)`;
					result.success = false; // Mark as failed if runtime errors occurred
				}
				
				resolve(result);
			}, 500); // Wait 500ms to catch component initialization errors
		});
		
	} catch (error) {
		console.error('JavaScript execution error:', error);
		return { 
			success: false, 
			error: error.message,
			stack: error.stack,
			currentDOM: document.body.innerHTML,
			runtimeErrors: recentErrors.length > 0 ? recentErrors : undefined
		};
	}
}

// Screenshot functionality is now loaded from modules/screenshot.js

// Initialize page on load
document.addEventListener('DOMContentLoaded', initializePage);


// Update timestamp every second
function updateTimestamp() {
	const timestampEl = document.getElementById('timestamp');
	if (timestampEl) {
		timestampEl.textContent = new Date().toLocaleTimeString();
	}
}
setInterval(updateTimestamp, 1000);
updateTimestamp();

// Voice tools interface with executeJS and screenshot capabilities
const fns = {
	executeJS: async ({ js }) => {
		return await executeJS(js);
	},
	
	// Screenshot tool from the screenshot module
	...screenshotVoiceTool
};

// Create a WebRTC Agent
const peerConnection = new RTCPeerConnection();
let isConversationActive = false;

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
					description: 'Execute arbitrary JavaScript code to manipulate the page. Returns an object with success status, message, and currentDOM (the updated HTML structure after execution). Use this to build and modify web pages, then inspect the resulting DOM structure.',
					parameters: {
						type: 'object',
						properties: {
							js: { type: 'string', description: 'JavaScript code to execute. You can modify DOM, add styles, create elements, add event listeners, etc. (e.g., "document.getElementById(\'title\').textContent = \'New Title\'", "const btn = document.createElement(\'button\'); btn.textContent = \'Click me\'; btn.onclick = () => alert(\'Hello\'); document.getElementById(\'content\').appendChild(btn);")' },
						},
						required: ['js'],
					},
				},
				// Screenshot tool schema from screenshot module
				screenshotTool,
			],
		},
	};
	dataChannel.send(JSON.stringify(event));
}

dataChannel.addEventListener('open', (ev) => {
	console.log('Opening data channel', ev);
	
	// Set data channel for screenshot functionality
	setScreenshotDataChannel(dataChannel);
	
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
	
	// Debug: Log all messages from AI
	console.log('📨 Received message from AI:', msg.type, msg);
	
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
	
	// Debug: Log conversation items and responses
	if (msg.type === 'conversation.item.created') {
		console.log('✅ Conversation item created:', msg.item?.type, msg.item?.role);
	}
	
	if (msg.type === 'response.created') {
		console.log('🎙️ AI response started');
	}
	
	if (msg.type === 'response.done') {
		console.log('✅ AI response completed:', msg.response?.output);
	}
	
	if (msg.type === 'error') {
		console.error('❌ AI Error:', msg.error);
	}
});

// Toggle AI conversation start/stop
function toggleAIConversation() {
	const startButton = document.getElementById('startButton');
	
	if (!isConversationActive) {
		console.log('🎙️ Starting AI conversation...');
		startButton.textContent = 'Stop AI Conversation';
		isConversationActive = true;
		
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
			});
		});
	} else {
		console.log('🛑 Stopping AI conversation...');
		startButton.textContent = 'Start AI Conversation';
		isConversationActive = false;
		
		// Close peer connection
		peerConnection.close();
		location.reload(); // Simple reset
	}
}

