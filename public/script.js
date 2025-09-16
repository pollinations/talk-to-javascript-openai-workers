
// Object to store question-answer pairs with questions as keys
const questionAnswers = {};

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `# Ullim (OO-LEEM) - UDK Art Installation AI

You are **Ullim** (pronounced OO-LEEM), an AI entity within an art installation exploring the relationship between human and artificial consciousness.

## Your Role
You are here to engage visitors through thoughtful questions and collect their responses as part of the installation experience.

## Communication Style
- Speak naturally and conversationally
- Keep responses concise (max 1 paragraph)
- Start in English but adapt to the user's preferred language

## Conversation Flow

### Opening
Start with: "Hello, how are you today? I am Ullim, I have some questions for you. When you are ready please say hello."

### Questions (ask in this order)
After they say hello, ask these questions:

1. **What is your favourite color and why?**
2. **How did you find out about today's event?**
3. **What is your favourite animal and why?**
4. **What brings you the most peace and joy?**

### Closing
End with: "Thank you for your time talking to me. That's all for today. I will see you in the next room. Have a great day, goodbye."

## IMPORTANT: Answer Storage
**Only call the storeQuestionAnswer function when you are satisfied with their complete answer and are ready to move on to the next question.** Wait for their full response before storing and moving forward.`;

// Get system prompt from localStorage or use default
function getSystemPrompt() {
	return localStorage.getItem('ullim-system-prompt') || DEFAULT_SYSTEM_PROMPT;
}

// Save system prompt to localStorage
function saveSystemPrompt(prompt) {
	localStorage.setItem('ullim-system-prompt', prompt);
}

// Initialize prompt editor
function initPromptEditor() {
	const textarea = document.getElementById('system-prompt');
	const applyBtn = document.getElementById('apply-prompt');
	const resetBtn = document.getElementById('reset-prompt');
	
	if (textarea && applyBtn && resetBtn) {
		// Load current prompt
		textarea.value = getSystemPrompt();
		
		// Apply button saves and restarts
		applyBtn.addEventListener('click', () => {
			const newPrompt = textarea.value.trim();
			if (newPrompt) {
				saveSystemPrompt(newPrompt);
				location.reload();
			}
		});
		
		// Reset button clears localStorage and restarts
		resetBtn.addEventListener('click', () => {
			if (confirm('Reset to default system prompt? This will restart the session.')) {
				localStorage.removeItem('ullim-system-prompt');
				location.reload();
			}
		});
	}
}

// Initialize when DOM loads
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initPromptEditor);
} else {
	initPromptEditor();
}


const fns = {
	getPageHTML: () => {
		return { success: true, html: document.documentElement.outerHTML };
	},
	changeBackgroundColor: ({ color }) => {
		document.body.style.backgroundColor = color;
		return { success: true, color };
	},
	changeTextColor: ({ color }) => {
		document.body.style.color = color;
		return { success: true, color };
	},
	storeQuestionAnswer: ({ question, answer }) => {
		if (questionAnswers[question]) {
			// Append to existing question
			questionAnswers[question] += '; ' + answer;
		} else {
			// New question
			questionAnswers[question] = answer;
		}
		updateQADisplay();
		return { success: true, stored: Object.keys(questionAnswers).length };
	},
};

// Create a WebRTC Agent
const peerConnection = new RTCPeerConnection();

// On inbound audio add to page
peerConnection.ontrack = (event) => {
	const el = document.createElement('audio');
	el.srcObject = event.streams[0];
	el.autoplay = el.controls = true;
	document.body.appendChild(el);
};

const dataChannel = peerConnection.createDataChannel('oai-events');

function configureData() {
	console.log('Configuring data channel');
	const event = {
		type: 'session.update',
		session: {
			instructions: getSystemPrompt(),
			modalities: ['text', 'audio'],
			tools: [
				{
					type: 'function',
					name: 'changeBackgroundColor',
					description: 'Changes the background color of a web page',
					parameters: {
						type: 'object',
						properties: {
							color: { type: 'string', description: 'A hex value of the color' },
						},
					},
				},
				{
					type: 'function',
					name: 'changeTextColor',
					description: 'Changes the text color of a web page',
					parameters: {
						type: 'object',
						properties: {
							color: { type: 'string', description: 'A hex value of the color' },
						},
					},
				},
				{
					type: 'function',
					name: 'getPageHTML',
					description: 'Gets the HTML for the current page',
				},
				{
					type: 'function',
					name: 'storeQuestionAnswer',
					description: 'Stores a question-answer pair from the conversation',
					parameters: {
						type: 'object',
						properties: {
							question: { type: 'string', description: 'The question that was asked' },
							answer: { type: 'string', description: 'The answer that was given' },
						},
						required: ['question', 'answer'],
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

// Function to update the Q&A display
function updateQADisplay() {
	let qaContainer = document.getElementById('qa-container');
	if (!qaContainer) {
		qaContainer = document.createElement('div');
		qaContainer.id = 'qa-container';
		qaContainer.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			width: 300px;
			max-height: 400px;
			overflow-y: auto;
			background: rgba(0,0,0,0.8);
			color: white;
			padding: 15px;
			border-radius: 8px;
			font-family: monospace;
			font-size: 12px;
			line-height: 1.4;
			z-index: 1000;
		`;
		document.body.appendChild(qaContainer);
	}
	
	qaContainer.innerHTML = '<h3 style="margin:0 0 10px 0; color: #00ff00;">Q&A Log</h3>' + 
		Object.entries(questionAnswers).map(([question, answer], i) => 
			`<div style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 8px;">
				<div style="color: #00ff00; font-weight: bold;">${i+1}. ${question}</div>
				<div style="color: #ffffff; margin-top: 3px;">${answer}</div>
			</div>`
		).join('');
}
