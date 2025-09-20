// Universal Voice Embed - Drop this script onto any webpage for voice editing

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.pollinationsVoiceEmbed) {
        console.log('🎤 Pollinations Voice Embed already loaded');
        return;
    }
    
    console.log('🎤 Initializing Pollinations Voice Embed...');
    
    // System prompt for voice-controlled web editing
    const systemPrompt = `# Voice-Controlled Web Page Editor

You are a voice-controlled assistant that edits and enhances existing web pages in real-time through JavaScript execution.

Start in English by default but adapt to the user's language.

## Your Approach

Follow the Plain Vanilla Web philosophy:
- No build tools, no frameworks - just HTML, CSS, JavaScript
- Browser-native technologies only
- Everything created through direct DOM manipulation
- Preserve existing page functionality while enhancing it

## Available Functions

**executeJS({js})** - Execute JavaScript code to modify the current page. Returns the updated DOM state after execution.

**captureScreenshot({message})** - Capture a screenshot of the current page for visual analysis.

## Execution Strategy

### Smart Page Enhancement
- Analyze existing page structure before making changes
- Preserve existing functionality and styling patterns
- Enhance rather than replace existing elements
- Use existing CSS frameworks if detected (Bootstrap, Tailwind, etc.)

### Variable Persistence - CRITICAL
- **Save ALL variables to window for later use**
- Use \`window.variableName = value;\` instead of \`const variableName = value;\`
- Always assign IDs: \`element.id = 'uniqueId';\` for DOM access

### String Escaping Guidelines
- Use backticks for complex strings: \`const html = \\\`<div class="container">\\\`;\`
- Template literals handle quotes naturally

## Implementation Patterns

### HTML Structure
- Use document.createElement() to build semantic HTML
- Create proper document structure with containers, sections, headers
- Build incrementally so users see progress

### CSS Styling
- Use element.style for direct styling or createElement('style') for CSS blocks
- Leverage CSS variables (--var) for theming
- Modern CSS: flexbox, grid, custom properties
- Responsive design with media queries

### JavaScript Functionality  
- Event listeners for interactivity
- ES6+ features: arrow functions, destructuring
- Web Components (class extends HTMLElement) for complex widgets

### External Resources
- **Images**: "https://image.pollinations.ai/prompt/[urlencoded prompt]?width=[width]&height=[height]&nologo=true"
- CDN imports for external libraries if needed
- Relative links for navigation

### Intelligent Element Targeting
- Use semantic selectors: \`document.querySelector('main')\`, \`document.querySelector('nav')\`
- Fallback to body if no semantic elements found
- Respect existing layout and styling

### Modern Enhancement
- Add interactive features to static content
- Improve accessibility and user experience
- Create responsive, mobile-friendly additions

## Examples

### Create Images with Pollinations.ai
\`\`\`javascript
const img = document.createElement('img');
img.src = 'https://image.pollinations.ai/prompt/beautiful%20sunset%20over%20mountains?width=800&height=400&nologo=true';
img.style.width = '100%';
img.style.borderRadius = '8px';
document.body.appendChild(img);
\`\`\`

### Add Interactive Elements
\`\`\`javascript
const btn = document.createElement('button');
btn.textContent = 'Click me';
btn.onclick = () => alert('Hello!');
btn.style.padding = '12px 24px';
btn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
btn.style.color = 'white';
btn.style.border = 'none';
btn.style.borderRadius = '6px';
document.body.appendChild(btn);
\`\`\`

## Guidelines
- Always execute complete, working code
- Preserve existing page functionality
- Make enhancements beautiful and modern
- Use semantic HTML structure
- Implement proper error handling
- **Remember: Enhance existing content, don't replace it**`;

    // Error collection system
    let recentErrors = [];
    const originalConsoleError = console.error;
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        const errorMessage = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        recentErrors.push({
            timestamp: Date.now(),
            message: errorMessage,
            stack: args[0]?.stack || null
        });
        
        const now = Date.now();
        recentErrors = recentErrors
            .filter(err => now - err.timestamp < 30000)
            .slice(-5);
    };

    // Execute JavaScript with error collection
    function executeJS(js) {
        console.log('🔧 executeJS called with:', js);
        recentErrors = [];
        
        try {
            eval(js);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    const result = {
                        success: true,
                        message: 'JavaScript executed successfully',
                        currentDOM: document.body.innerHTML
                    };
                    
                    if (recentErrors.length > 0) {
                        result.runtimeErrors = recentErrors.map(err => ({
                            message: err.message,
                            timestamp: err.timestamp,
                            stack: err.stack
                        }));
                        result.message += ` (${recentErrors.length} runtime error(s) detected)`;
                        result.success = false;
                    }
                    
                    resolve(result);
                }, 500);
            });
            
        } catch (error) {
            console.error('❌ JavaScript execution error:', error);
            return { 
                success: false, 
                error: error.message,
                stack: error.stack,
                currentDOM: document.body.innerHTML,
                runtimeErrors: recentErrors.length > 0 ? recentErrors : undefined
            };
        }
    }

    // Screenshot functionality (simplified for embed)
    let screenshotStream = null;
    let screenshotDataChannel = null;
    
    function setScreenshotDataChannel(dataChannel) {
        screenshotDataChannel = dataChannel;
    }
    
    async function captureScreenshot({ message = "Analyze this webpage" }) {
        if (!screenshotDataChannel) {
            return { success: false, error: "Screenshot data channel not available" };
        }
        
        try {
            // Try to reuse existing stream first
            if (!screenshotStream) {
                screenshotStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: 'screen', width: 1920, height: 1080 }
                });
            }
            
            const video = document.createElement('video');
            video.srcObject = screenshotStream;
            video.play();
            
            await new Promise(resolve => {
                video.addEventListener('loadedmetadata', resolve, { once: true });
            });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate optimal dimensions
            const maxWidth = 1920;
            const maxHeight = 1080;
            const aspectRatio = video.videoWidth / video.videoHeight;
            
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
            
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);
            
            // Progressive compression to target ~200KB
            let quality = 0.6;
            let dataURL;
            
            do {
                dataURL = canvas.toDataURL('image/jpeg', quality);
                quality -= 0.1;
            } while (dataURL.length > 200000 && quality > 0.1);
            
            // Send to AI via data channel
            const screenshotMessage = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [
                        { type: 'input_text', text: message },
                        { type: 'input_image', image_url: dataURL }
                    ]
                }
            };
            
            screenshotDataChannel.send(JSON.stringify(screenshotMessage));
            
            return { 
                success: true, 
                message: 'Screenshot captured and sent to AI',
                fileSize: Math.round(dataURL.length / 1024) + 'KB',
                dimensions: `${width}x${height}`
            };
            
        } catch (error) {
            console.error('Screenshot error:', error);
            return { success: false, error: error.message };
        }
    }

    // Voice tools interface
    const voiceTools = {
        executeJS: async ({ js }) => await executeJS(js),
        captureScreenshot: async ({ message }) => await captureScreenshot({ message })
    };

    // Tool schemas for OpenAI Realtime API
    const executeJSTool = {
        type: 'function',
        name: 'executeJS',
        description: 'Execute JavaScript code to modify the current webpage. Analyze existing page structure first, then enhance it while preserving functionality.',
        parameters: {
            type: 'object',
            properties: {
                js: { 
                    type: 'string', 
                    description: 'JavaScript code to execute. Enhance existing page elements rather than replacing them. Use semantic selectors and preserve existing functionality.'
                },
            },
            required: ['js'],
        },
    };

    const screenshotTool = {
        type: 'function',
        name: 'captureScreenshot',
        description: 'Capture a screenshot of the current webpage for visual analysis. Helps understand page layout and existing elements.',
        parameters: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'Context message for analyzing the screenshot (e.g., "What elements can I enhance on this page?")'
                }
            },
            required: ['message']
        }
    };

    // WebRTC and Voice Interface Setup
    let peerConnection = null;
    let isConversationActive = false;
    let voiceButton = null;

    function createVoiceInterface() {
        // Create floating voice button
        voiceButton = document.createElement('div');
        voiceButton.innerHTML = `
            <div id="pollinations-voice-interface" style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                z-index: 999999; 
                background: rgba(0, 0, 0, 0.8); 
                color: white;
                padding: 15px; 
                border-radius: 12px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; opacity: 0.8;"></div>
                    <span style="font-size: 14px; font-weight: 500;">Voice Editor</span>
                </div>
                <button id="pollinations-voice-btn" style="
                    padding: 10px 16px; 
                    font-size: 14px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-weight: 500;
                    width: 100%;
                    transition: all 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🎤 Start Voice Editing
                </button>
            </div>
        `;
        
        document.body.appendChild(voiceButton);
        
        // Add click handler
        const button = document.getElementById('pollinations-voice-btn');
        button.addEventListener('click', toggleVoiceConversation);
    }

    function buildSessionConfig() {
        return {
            type: 'session.update',
            session: {
                instructions: systemPrompt,
                modalities: ['text', 'audio'],
                tools: [executeJSTool, screenshotTool],
            },
        };
    }

    function sendInitialPageContext(dataChannel) {
        console.log('📄 Sending page context to AI...');
        
        const pageStructure = {
            title: document.title,
            url: window.location.href,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            bodyHTML: document.body.outerHTML.substring(0, 2000) + '...' // Truncate for context
        };
        
        const contextMessage = {
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{
                    type: 'input_text',
                    text: `CURRENT PAGE CONTEXT:

Title: ${pageStructure.title}
URL: ${pageStructure.url}
Viewport: ${pageStructure.viewport.width}x${pageStructure.viewport.height}

Current Page Structure (truncated):
${pageStructure.bodyHTML}

This is the existing webpage you can enhance with voice commands. Analyze the structure and suggest improvements or wait for user requests.`
                }]
            }
        };
        
        dataChannel.send(JSON.stringify(contextMessage));
    }

    async function handleFunctionCall(msg, dataChannel) {
        const fn = voiceTools[msg.name];
        if (fn) {
            console.log(`🔧 Calling ${msg.name} with`, msg.arguments);
            const args = JSON.parse(msg.arguments);
            const result = await fn(args);
            console.log('✅ Function result:', result);
            
            const outputEvent = {
                type: 'conversation.item.create',
                item: {
                    type: 'function_call_output',
                    call_id: msg.call_id,
                    output: JSON.stringify(result),
                },
            };
            dataChannel.send(JSON.stringify(outputEvent));
            dataChannel.send(JSON.stringify({ type: 'response.create' }));
        } else {
            console.error(`❌ Unknown function: ${msg.name}`);
        }
    }

    async function toggleVoiceConversation() {
        const button = document.getElementById('pollinations-voice-btn');
        
        if (!isConversationActive) {
            console.log('🎙️ Starting voice conversation...');
            button.textContent = '🛑 Stop Voice Editing';
            isConversationActive = true;
            await startWebRTCConnection();
        } else {
            stopVoiceConversation();
        }
    }

    async function startWebRTCConnection() {
        try {
            peerConnection = new RTCPeerConnection();
            
            // Handle incoming audio
            peerConnection.ontrack = (event) => {
                const audio = document.createElement('audio');
                audio.srcObject = event.streams[0];
                audio.autoplay = true;
                audio.style.display = 'none';
                document.body.appendChild(audio);
            };

            // Create data channel
            const dataChannel = peerConnection.createDataChannel('oai-events');
            setScreenshotDataChannel(dataChannel);

            dataChannel.addEventListener('open', () => {
                console.log('📡 Data channel opened');
                const sessionConfig = buildSessionConfig();
                dataChannel.send(JSON.stringify(sessionConfig));
                setTimeout(() => sendInitialPageContext(dataChannel), 100);
            });

            dataChannel.addEventListener('message', async (ev) => {
                const msg = JSON.parse(ev.data);
                console.log('📨 Received:', msg.type);
                
                if (msg.type === 'response.function_call_arguments.done') {
                    await handleFunctionCall(msg, dataChannel);
                }
            });

            // Get microphone and set up WebRTC
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => {
                peerConnection.addTransceiver(track, { direction: 'sendrecv' });
            });

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            // Connect to backend (always use the voice embed server)
            const backendUrl = window.pollinationsVoiceEmbed.serverUrl || 'https://voicevibecode.thomash-efd.workers.dev';
            const tokenResponse = await fetch(`${backendUrl}/session`);
            const data = await tokenResponse.json();
            console.log('🔍 Session response:', data); // Debug log
            
            // Check for error in response
            if (data.error) {
                throw new Error(`Session API error: ${data.error.message} - ${data.error.details || 'No details'}`);
            }
            
            if (!data.client_secret || !data.client_secret.value) {
                throw new Error(`Invalid session response: missing client_secret. Got: ${JSON.stringify(data)}`);
            }
            
            const EPHEMERAL_KEY = data.client_secret.value;
            
            const response = await fetch(`https://api.openai.com/v1/realtime?model=gpt-realtime`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp',
                },
            });
            
            const answer = await response.text();
            await peerConnection.setRemoteDescription({ sdp: answer, type: 'answer' });
            
            console.log('✅ Voice editing ready!');
            
        } catch (error) {
            console.error('❌ Voice setup failed:', error);
            stopVoiceConversation();
        }
    }

    function stopVoiceConversation() {
        console.log('🛑 Stopping voice conversation...');
        const button = document.getElementById('pollinations-voice-btn');
        button.textContent = '🎤 Start Voice Editing';
        isConversationActive = false;
        
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        
        if (screenshotStream) {
            screenshotStream.getTracks().forEach(track => track.stop());
            screenshotStream = null;
        }
    }

    // Initialize the voice interface
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createVoiceInterface);
        } else {
            createVoiceInterface();
        }
        
        // Mark as loaded with server configuration
        window.pollinationsVoiceEmbed = {
            version: '1.0.0',
            serverUrl: 'https://voicevibecode.thomash-efd.workers.dev', // Default server URL
            executeJS,
            captureScreenshot,
            toggleVoiceConversation
        };
        
        console.log('✅ Pollinations Voice Embed ready!');
    }

    // Initialize
    init();

})();
