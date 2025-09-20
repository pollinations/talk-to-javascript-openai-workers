// Ultra-short console command to load voice editor on any website
// Usage: Copy and paste this into browser console on any webpage

// SHORTEST VERSION (89 characters):
(s=document.createElement('script')).src='https://voicevibecode.thomash-efd.workers.dev/voice-embed.js';document.head.appendChild(s)

// READABLE SHORT VERSION (with basic check):
(function(){if(window.pollinationsVoiceEmbed)return;const s=document.createElement('script');s.src='https://voicevibecode.thomash-efd.workers.dev/voice-embed.js';document.head.appendChild(s)})();
