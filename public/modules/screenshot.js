// Simplified Screenshot functionality using Screen Capture API
// Modern, minimal implementation based on MDN best practices 2024/2025

// Global state - minimal
let screenshotDataChannel = null;

// Set the data channel for sending screenshots to AI
function setScreenshotDataChannel(channel) {
	screenshotDataChannel = channel;
}

// Simple screenshot capture using Screen Capture API
async function captureScreenshot() {
	console.log('📸 Capturing screenshot using Screen Capture API...');
	
	try {
		// Simple getDisplayMedia call - follows MDN best practices
		const stream = await navigator.mediaDevices.getDisplayMedia({
			video: { 
				cursor: "never",
				width: { ideal: 1920 },
				height: { ideal: 1080 }
			}
		});
		
		const [track] = stream.getVideoTracks();
		const imageCapture = new ImageCapture(track);
		const bitmap = await imageCapture.grabFrame();

		// Create canvas and draw image
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		canvas.getContext('2d').drawImage(bitmap, 0, 0);

		// Compress to JPEG with progressive quality reduction if needed
		let quality = 0.6;
		let dataURL = canvas.toDataURL('image/jpeg', quality);
		
		// Reduce quality if file is too large (200KB target)
		while (dataURL.length > 200000 && quality > 0.2) {
			quality -= 0.1;
			dataURL = canvas.toDataURL('image/jpeg', quality);
		}

		// Stop capture immediately
		track.stop();
		
		console.log(`✅ Screenshot captured: ${bitmap.width}x${bitmap.height}, ${Math.round(dataURL.length/1000)}KB, quality: ${quality.toFixed(1)}`);
		
		return {
			success: true,
			dataURL: dataURL,
			width: bitmap.width,
			height: bitmap.height,
			quality: quality,
			fileSize: dataURL.length,
			message: `Screenshot captured (${bitmap.width}x${bitmap.height}, ${Math.round(dataURL.length/1000)}KB)`
		};
		
	} catch (error) {
		console.error('❌ Screenshot capture error:', error);
		return {
			success: false,
			error: error.message,
			message: 'Screenshot capture failed. Make sure you\'re on HTTPS and grant screen sharing permission.'
		};
	}
}

// Send screenshot to GPT-realtime model using correct format
async function sendScreenshotToAI(dataURL, message = "Here's a screenshot of the current page") {
	console.log('📤 Sending screenshot to AI...');
	
	if (!screenshotDataChannel || screenshotDataChannel.readyState !== 'open') {
		return {
			success: false,
			error: 'Data channel not available',
			message: 'Cannot send screenshot - no connection to AI'
		};
	}
	
	try {
		// Use the correct format based on OpenAI community forum research
		const event = {
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
						image_url: dataURL // Direct data URL format
					}
				]
			}
		};
		
		screenshotDataChannel.send(JSON.stringify(event));
		
		// Trigger AI response
		screenshotDataChannel.send(JSON.stringify({type: "response.create"}));
		
		console.log('✅ Screenshot sent to AI successfully');
		return { success: true, message: 'Screenshot sent to AI' };
		
	} catch (error) {
		console.error('❌ Error sending screenshot to AI:', error);
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

// Screenshot tool schema for voice interface
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
export { setScreenshotDataChannel, screenshotTool, screenshotVoiceTool };
