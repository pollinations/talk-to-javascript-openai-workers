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

## Customization

The system prompt can be edited directly in `public/script.js` to modify Ullim's personality, conversation flow, or add new interactive functions. The interface supports localStorage-based prompt editing for live installations.

## Repository

This project is maintained under the [Pollinations](https://github.com/pollinations) organization, exploring the intersection of AI, art, and human interaction.
