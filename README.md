# Ullim Voice Interface - Boundaries of Agency

An interactive voice-controlled art installation exploring the relationship between human and artificial consciousness. This project features **Ullim** (pronounced OO-LEEM), an AI entity that engages visitors through thoughtful questions while demonstrating real-time web manipulation capabilities.

## About the Installation

This interface serves as part of an art installation examining the boundaries of agency between humans and AI systems. Ullim conducts structured interviews with visitors, collecting their responses while dynamically changing the visual environment based on their answers.

### Key Features

- **Real-time Voice Communication**: Uses OpenAI's latest Realtime API for natural conversation
- **Dynamic Visual Responses**: Changes background colors based on visitor preferences  
- **Structured Interview Flow**: Guided conversation with 4 specific questions
- **Glitch Transition Effects**: Matrix-style visual effects for room transitions
- **Response Logging**: Stores visitor answers for installation documentation
- **Editable System Prompt**: Customizable AI personality and behavior


## Technical Implementation

Built with:
- **OpenAI Realtime API**: Latest `gpt-realtime` model with Cedar voice
- **Cloudflare Workers**: Serverless backend for API key protection
- **WebRTC**: Real-time audio communication
- **Client-side Tool Calling**: Dynamic web manipulation functions

### Interview Questions

1. **What is your favourite color and why?** (Triggers background color change)
2. **How did you find out about today's event?**
3. **What is your favourite animal and why?**
4. **What brings you the most peace and joy?**

## Development Setup

Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars` and add your OpenAI API Key:

```bash
OPENAI_API_KEY=your_api_key_here
```

Install dependencies and run locally:

```bash
npm install
npm run dev
```

Visit `http://localhost:54437` and click "Start AI Conversation" to begin.

## Deployment

Upload your API key secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Optional Libraries

The interface is designed to be minimal by default, but you can enhance it with additional JavaScript libraries. Here are some that work well with the voice-controlled approach:

### 3D Graphics & Animation
- **Three.js**: `https://unpkg.com/three@0.158.0/build/three.min.js`
- **A-Frame**: `https://aframe.io/releases/1.4.0/aframe.min.js`
- **GSAP**: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`

### Data Visualization
- **D3.js**: `https://d3js.org/d3.v7.min.js`
- **Chart.js**: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js`
- **P5.js**: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js`

### UI & Interaction
- **Fabric.js**: `https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js`
- **Lottie**: `https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js`

### Audio & Media
- **Tone.js**: `https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js`
- **Howler.js**: `https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js`

### Usage
Add any of these to your `index.html` before the main scripts:
```html
<script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>
<script src="/modules/screenshot.js"></script>
<script src="/script.js"></script>
```

The voice interface will automatically detect available libraries and can use them in executeJS commands.

## Customization

The system prompt can be edited directly in `public/script.js` to modify Ullim's personality, conversation flow, or add new interactive functions. The interface supports localStorage-based prompt editing for live installations.

## Repository

This project is maintained under the [Pollinations](https://github.com/pollinations) organization, exploring the intersection of AI, art, and human interaction.
