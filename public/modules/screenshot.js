// Screenshot functionality using Screen Capture API
// Modern, pixel-perfect screenshot capture with GPT-realtime integration

class ScreenshotManager {
	constructor() {
		this.dataChannel = null; // Will be set by main script
		
		// Persistent screen capture
		this.persistentStream = null;
		this.persistentTrack = null;
		this.imageCapture = null;
		this.isStreamActive = false;
		
		// Configuration
		this.maxWidth = 1920;
		this.maxHeight = 1080;
		this.jpegQuality = 0.6;
		this.maxFileSize = 200000; // 200KB target
	}

	// Set the data channel for sending screenshots to AI
	setDataChannel(channel) {
		this.dataChannel = channel;
	}

	// Initialize persistent screen capture stream (ask user once)
	async initializePersistentCapture() {
		if (this.isStreamActive) {
			console.log('📺 Persistent capture already active');
			return { success: true, message: 'Screen capture already initialized' };
		}

		try {
			console.log('🎬 Initializing persistent screen capture...');
			
			// Ask user once for screen/window selection
			this.persistentStream = await navigator.mediaDevices.getDisplayMedia({
				video: { 
					cursor: "never",
					width: { max: this.maxWidth },
					height: { max: this.maxHeight }
				}
			});
			
			this.persistentTrack = this.persistentStream.getVideoTracks()[0];
			this.imageCapture = new ImageCapture(this.persistentTrack);
			this.isStreamActive = true;
			
			// Handle stream ending (user stops sharing)
			this.persistentTrack.onended = () => {
				console.log('📺 Screen sharing ended by user');
				this.cleanup();
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
	cleanup() {
		if (this.persistentTrack) {
			this.persistentTrack.stop();
			this.persistentTrack = null;
		}
		if (this.persistentStream) {
			this.persistentStream = null;
		}
		this.imageCapture = null;
		this.isStreamActive = false;
		console.log('🧹 Screen capture resources cleaned up');
	}

	// Fast screenshot capture using persistent stream (no user prompts)
	async captureScreenshotFast() {
		if (!this.isStreamActive || !this.imageCapture) {
			console.log('🎬 No persistent capture active, initializing...');
			const initResult = await this.initializePersistentCapture();
			if (!initResult.success) {
				return initResult;
			}
		}

		try {
			console.log('📸 Capturing screenshot from persistent stream...');
			
			// Grab frame from persistent stream
			const bitmap = await this.imageCapture.grabFrame();
			
			// Calculate optimal dimensions (scale down if too large)
			let { width, height } = this.calculateOptimalDimensions(bitmap.width, bitmap.height);
			
			// Create canvas with optimized dimensions
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			
			// Draw scaled image
			const ctx = canvas.getContext('2d');
			ctx.drawImage(bitmap, 0, 0, width, height);
			
			// Progressive quality compression
			let dataURL = canvas.toDataURL('image/jpeg', this.jpegQuality);
			let quality = this.jpegQuality;
			
			// Reduce quality until we hit target file size
			while (dataURL.length > this.maxFileSize && quality > 0.2) {
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
			this.cleanup();
			return await this.captureScreenshotLegacy();
		}
	}

	// Calculate optimal dimensions to stay within limits
	calculateOptimalDimensions(originalWidth, originalHeight) {
		let width = originalWidth;
		let height = originalHeight;
		
		// Scale down if larger than max dimensions
		if (width > this.maxWidth || height > this.maxHeight) {
			const widthRatio = this.maxWidth / width;
			const heightRatio = this.maxHeight / height;
			const ratio = Math.min(widthRatio, heightRatio);
			
			width = Math.round(width * ratio);
			height = Math.round(height * ratio);
			
			console.log(`📏 Scaling down from ${originalWidth}x${originalHeight} to ${width}x${height} (ratio: ${ratio.toFixed(2)})`);
		}
		
		return { width, height };
	}

	// Legacy screenshot capture (fallback - prompts user each time)
	async captureScreenshotLegacy() {
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
			let { width, height } = this.calculateOptimalDimensions(bitmap.width, bitmap.height);

			// Create canvas with optimized dimensions
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);

			// Progressive quality compression
			let dataURL = canvas.toDataURL('image/jpeg', this.jpegQuality);
			let quality = this.jpegQuality;
			
			while (dataURL.length > this.maxFileSize && quality > 0.2) {
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
	async captureScreenshot() {
		return await this.captureScreenshotFast();
	}

	// Send screenshot to GPT-realtime model
	async sendScreenshotToAI(dataURL, message = "Here's a screenshot of the current page") {
		console.log('Sending screenshot to AI...');
		console.log('Data channel state:', this.dataChannel?.readyState);
		console.log('Data URL length:', dataURL.length);
		console.log('Data URL prefix:', dataURL.substring(0, 50));
		
		// Add event listener to monitor data channel state changes
		const originalOnClose = this.dataChannel.onclose;
		const originalOnError = this.dataChannel.onerror;
		
		this.dataChannel.onclose = (event) => {
			console.warn('🔴 Data channel closed during screenshot transmission:', event);
			if (originalOnClose) originalOnClose(event);
		};
		
		this.dataChannel.onerror = (error) => {
			console.error('🔴 Data channel error during screenshot transmission:', error);
			if (originalOnError) originalOnError(error);
		};
		
		if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
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
			this.dataChannel.send(JSON.stringify(event));
			console.log('Conversation item sent successfully');
			
			// Check data channel state before sending response trigger
			if (this.dataChannel.readyState === 'open') {
				const responseEvent = {type: "response.create"};
				console.log('Sending response trigger:', responseEvent);
				this.dataChannel.send(JSON.stringify(responseEvent));
				console.log('Response trigger sent successfully');
			} else {
				console.warn('⚠️ Data channel closed before sending response trigger, state:', this.dataChannel.readyState);
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
	async captureAndSendScreenshot(message = "What do you see in this screenshot?") {
		const captureResult = await this.captureScreenshot();
		
		if (captureResult.success) {
			const sendResult = await this.sendScreenshotToAI(captureResult.dataURL, message);
			return {
				success: sendResult.success,
				message: `${captureResult.message}. ${sendResult.message}`,
				error: sendResult.error
			};
		} else {
			return captureResult;
		}
	}



	// Get voice tool functions for integration
	getVoiceTools() {
		return {
			captureScreenshot: async ({ message }) => {
				return await this.captureAndSendScreenshot(message);
			}
		};
	}
}

// Export for use in main script
window.ScreenshotManager = ScreenshotManager;
