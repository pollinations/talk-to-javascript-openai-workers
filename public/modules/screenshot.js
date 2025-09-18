// Screenshot functionality using Screen Capture API
// Modern, pixel-perfect screenshot capture with GPT-realtime integration

// Global state
let screenshotDataChannel = null;
let screenshotPersistentStream = null;
let screenshotPersistentTrack = null;
let screenshotImageCapture = null;
let screenshotIsStreamActive = false;

// Configuration
const screenshotConfig = {
	maxWidth: 1920,
	maxHeight: 1080,
	jpegQuality: 0.6,
	maxFileSize: 200000 // 200KB target
};

// Set the data channel for sending screenshots to AI
function setScreenshotDataChannel(channel) {
	screenshotDataChannel = channel;
}

// Initialize persistent screen capture stream (ask user once)
async function initializePersistentCapture() {
	if (screenshotIsStreamActive) {
		console.log('📺 Persistent capture already active');
		return { success: true, message: 'Screen capture already initialized' };
	}

	try {
		console.log('🎬 Initializing persistent screen capture...');
		
		// Ask user once for screen/window selection
		screenshotPersistentStream = await navigator.mediaDevices.getDisplayMedia({
			video: { 
				cursor: "never",
				width: { max: screenshotConfig.maxWidth },
				height: { max: screenshotConfig.maxHeight }
			}
		});
		
		screenshotPersistentTrack = screenshotPersistentStream.getVideoTracks()[0];
		screenshotImageCapture = new ImageCapture(screenshotPersistentTrack);
		screenshotIsStreamActive = true;
		
		// Handle stream ending (user stops sharing)
		screenshotPersistentTrack.onended = () => {
			console.log('📺 Screen sharing ended by user');
			cleanupScreenshotCapture();
		};
		
		console.log('✅ Persistent screen capture initialized');
		return { 
			success: true, 
			message: 'Screen capture initialized - no more prompts needed!' 
		};
		
	} catch (error) {
		console.error('❌ Failed to initialize persistent capture:', error);
		return {
			success: false,
			error: error.message,
			message: 'Failed to initialize screen capture. Please grant permission.'
		};
	}
}

// Cleanup persistent capture resources
function cleanupScreenshotCapture() {
	if (screenshotPersistentTrack) {
		screenshotPersistentTrack.stop();
		screenshotPersistentTrack = null;
	}
	if (screenshotPersistentStream) {
		screenshotPersistentStream = null;
	}
	screenshotImageCapture = null;
	screenshotIsStreamActive = false;
	console.log('🧹 Screen capture resources cleaned up');
}

// Fast screenshot capture using persistent stream (no user prompts)
async function captureScreenshotFast() {
	if (!screenshotIsStreamActive || !screenshotImageCapture) {
		console.log('🎬 No persistent capture active, initializing...');
		const initResult = await initializePersistentCapture();
		if (!initResult.success) {
			return initResult;
		}
	}

	try {
		console.log('📸 Capturing screenshot from persistent stream...');
		
		// Grab frame from persistent stream
		const bitmap = await screenshotImageCapture.grabFrame();
		
		// Calculate optimal dimensions (scale down if too large)
		let { width, height } = calculateOptimalDimensions(bitmap.width, bitmap.height);
		
		// Create canvas with optimized dimensions
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		
		// Draw scaled image
		const ctx = canvas.getContext('2d');
		ctx.drawImage(bitmap, 0, 0, width, height);
		
		// Progressive quality compression
		let dataURL = canvas.toDataURL('image/jpeg', screenshotConfig.jpegQuality);
		let quality = screenshotConfig.jpegQuality;
		
		// Reduce quality until we hit target file size
		while (dataURL.length > screenshotConfig.maxFileSize && quality > 0.2) {
			quality -= 0.1;
			dataURL = canvas.toDataURL('image/jpeg', quality);
			console.log(`📉 Reducing quality to ${quality.toFixed(1)}, size: ${Math.round(dataURL.length/1000)}KB`);
		}
		
		console.log(`✅ Screenshot captured: ${width}x${height}, ${Math.round(dataURL.length/1000)}KB, quality: ${quality.toFixed(1)}`);
		
		return {
			success: true,
			dataURL: dataURL,
			width: width,
			height: height,
			originalWidth: bitmap.width,
			originalHeight: bitmap.height,
			quality: quality,
			fileSize: dataURL.length,
			message: `Screenshot captured (${width}x${height}, ${Math.round(dataURL.length/1000)}KB)`
		};
		
	} catch (error) {
		console.error('❌ Fast screenshot capture error:', error);
		
		// If persistent stream failed, cleanup and fall back to old method
		cleanupScreenshotCapture();
		return await captureScreenshotLegacy();
	}
}

// Calculate optimal dimensions to stay within limits
function calculateOptimalDimensions(originalWidth, originalHeight) {
	let width = originalWidth;
	let height = originalHeight;
	
	// Scale down if larger than max dimensions
	if (width > screenshotConfig.maxWidth || height > screenshotConfig.maxHeight) {
		const widthRatio = screenshotConfig.maxWidth / width;
		const heightRatio = screenshotConfig.maxHeight / height;
		const ratio = Math.min(widthRatio, heightRatio);
		
		width = Math.round(width * ratio);
		height = Math.round(height * ratio);
		
		console.log(`📏 Scaling down from ${originalWidth}x${originalHeight} to ${width}x${height} (ratio: ${ratio.toFixed(2)})`);
	}
	
	return { width, height };
}

// Legacy screenshot capture (fallback - prompts user each time)
async function captureScreenshotLegacy() {
	console.log('📸 Using legacy screenshot capture (will prompt user)...');
	
	try {
		// Prompt the user to share a tab/window/screen
		const stream = await navigator.mediaDevices.getDisplayMedia({
			video: { cursor: "never" } // Don't show cursor in screenshot
		});
		const [track] = stream.getVideoTracks();

		// Grab a single frame
		const imageCapture = new ImageCapture(track);
		const bitmap = await imageCapture.grabFrame();

		// Calculate optimal dimensions
		let { width, height } = calculateOptimalDimensions(bitmap.width, bitmap.height);

		// Create canvas with optimized dimensions
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);

		// Progressive quality compression
		let dataURL = canvas.toDataURL('image/jpeg', screenshotConfig.jpegQuality);
		let quality = screenshotConfig.jpegQuality;
		
		while (dataURL.length > screenshotConfig.maxFileSize && quality > 0.2) {
			quality -= 0.1;
			dataURL = canvas.toDataURL('image/jpeg', quality);
		}

		// Stop capture immediately after one shot
		track.stop();
		
		console.log(`✅ Legacy screenshot: ${width}x${height}, ${Math.round(dataURL.length/1000)}KB`);
		return {
			success: true,
			dataURL: dataURL,
			width: width,
			height: height,
			message: `Screenshot captured (${width}x${height}, ${Math.round(dataURL.length/1000)}KB)`
		};
		
	} catch (error) {
		console.error('Screenshot capture error:', error);
		return {
			success: false,
			error: error.message,
			message: 'Screenshot capture failed. Make sure you\'re on HTTPS and grant screen sharing permission.'
		};
	}
}

// Main screenshot method (uses fast capture if available, falls back to legacy)
async function captureScreenshot() {
	return await captureScreenshotFast();
}

// Send screenshot to GPT-realtime model
async function sendScreenshotToAI(dataURL, message = "Here's a screenshot of the current page") {
	console.log('Sending screenshot to AI...');
	console.log('Data channel state:', screenshotDataChannel?.readyState);
	console.log('Data URL length:', dataURL.length);
	console.log('Data URL prefix:', dataURL.substring(0, 50));
	
	// Add event listener to monitor data channel state changes
	const originalOnClose = screenshotDataChannel.onclose;
	const originalOnError = screenshotDataChannel.onerror;
	
	screenshotDataChannel.onclose = (event) => {
		console.warn('🔴 Data channel closed during screenshot transmission:', event);
		if (originalOnClose) originalOnClose(event);
	};
	
	screenshotDataChannel.onerror = (error) => {
		console.error('🔴 Data channel error during screenshot transmission:', error);
		if (originalOnError) originalOnError(error);
	};
	
	if (!screenshotDataChannel || screenshotDataChannel.readyState !== 'open') {
		return {
			success: false,
			error: 'Data channel not available',
			message: 'Cannot send screenshot - no connection to AI'
		};
	}
	
	try {
		// Try multiple formats based on research findings
		// Format 1: Based on Azure docs and community examples
		const event1 = {
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [
					{
						type: 'input_text',
						text: message
					},
					{
						type: 'input_image',
						image_url: dataURL // data:image/jpeg;base64,... format as string
					}
				]
			}
		};
		
		// Format 2: Alternative format found in community discussions
		const event2 = {
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [
					{
						type: 'text',
						text: message
					},
					{
						type: 'image_url',
						image_url: {
							url: dataURL
						}
					}
				]
			}
		};
		
		// Format 3: Simplified format based on working examples
		const event3 = {
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [
					{
						type: 'input_image',
						image_url: dataURL
					}
				]
			}
		};
		
		// Try the first format (most documented)
		const event = event1;
		
		console.log('🔄 Trying Format 1 (Azure docs format)');
		console.log('Sending event:', JSON.stringify(event, null, 2).substring(0, 500) + '...');
		
		// Send via data channel
		screenshotDataChannel.send(JSON.stringify(event));
		console.log('Conversation item sent successfully');
		
		// Check data channel state before sending response trigger
		if (screenshotDataChannel.readyState === 'open') {
			const responseEvent = {type: "response.create"};
			console.log('Sending response trigger:', responseEvent);
			screenshotDataChannel.send(JSON.stringify(responseEvent));
			console.log('Response trigger sent successfully');
		} else {
			console.warn('⚠️ Data channel closed before sending response trigger, state:', screenshotDataChannel.readyState);
		}
		
		console.log('Screenshot sent to AI successfully');
		return { success: true, message: 'Screenshot sent to AI' };
		
	} catch (error) {
		console.error('Error sending screenshot to AI:', error);
		console.error('Error details:', error.stack);
		return { success: false, error: error.message };
	}
}

// Combined function to capture and send screenshot
async function captureAndSendScreenshot(message = "What do you see in this screenshot?") {
	const captureResult = await captureScreenshot();
	
	if (captureResult.success) {
		const sendResult = await sendScreenshotToAI(captureResult.dataURL, message);
		return {
			success: sendResult.success,
			message: `${captureResult.message}. ${sendResult.message}`,
			error: sendResult.error
		};
	} else {
		return captureResult;
	}
}

// Screenshot tool schema and function for voice interface
const screenshotTool = {
	type: 'function',
	name: 'captureScreenshot',
	description: 'Capture a screenshot of the current page and send it for visual analysis. Automatically optimizes resolution and file size.',
	parameters: {
		type: 'object',
		properties: {
			message: { 
				type: 'string', 
				description: 'Optional message to send with the screenshot (e.g., "What do you see?", "Analyze this layout", "How does this look?"). Default: "What do you see in this screenshot?"' 
			},
		},
		required: [],
	},
};

// Voice tool function for integration
const screenshotVoiceTool = {
	captureScreenshot: async ({ message }) => {
		return await captureAndSendScreenshot(message);
	}
};

// Export functions for use in main script
window.setScreenshotDataChannel = setScreenshotDataChannel;
window.screenshotTool = screenshotTool;
window.screenshotVoiceTool = screenshotVoiceTool;
