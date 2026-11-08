/* ASTRON — one place to edit site facts. Loaded before script.js. */
window.ASTRON_SITE = {
  version: '1.2',
  released: '2026-08',
  // GitHub "owner/repo" used for the live star and download counts. Counts stay hidden if the lookup fails or is zero.
  repo: 'nexus-ai6767/jarvis-ai',

  // Real quotes only. Leave empty and the "Early feedback" section stays hidden.
  // Example: { quote: 'Replaced three browser tabs I used to keep open.', name: 'A. Sharma', role: 'Student, Pune' }
  testimonials: [],

  // Real Android screenshots. Put the image files next to index.html (flat folder) and list their names here,
  // in this order: chat screen, voice screen, memory screen. The concept mockups are replaced automatically.
  // Example: ['android-chat.webp', 'android-voice.webp', 'android-memory.webp']
  androidScreens: [],

  // Short screen recording (muted, looping, lazy-loaded). Put the files next to index.html.
  // Leave empty and the "See it in action" section stays hidden. Keep it under ~4 MB; mp4 (H.264) alone is fine.
  // Example: { mp4: 'astron-demo.mp4', webm: 'astron-demo.webm', poster: 'astron-demo-poster.webp', caption: 'Opening apps and saving a note by voice.' }
  demoVideo: null,

  // Optional cinematic intro screen (adds about 1 second before the hero is visible). Off by default so the page and 3D core appear instantly.
  bootScreen: false
};
