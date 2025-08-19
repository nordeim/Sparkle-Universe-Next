/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 271 91% 65%;  /* Sparkle Purple */
    --primary-foreground: 0 0% 98%;
    --secondary: 327 73% 58%;  /* Sparkle Pink */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 158 64% 42%;  /* Sparkle Green */
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 271 91% 65%;
    --radius: 0.625rem;
    
    /* Sparkle theme specific */
    --sparkle-purple: 271 91% 65%;
    --sparkle-pink: 327 73% 58%;
    --sparkle-blue: 217 91% 60%;
    --sparkle-green: 158 64% 42%;
    --sparkle-gold: 38 92% 50%;
    
    /* Font variables */
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 271 91% 65%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 327 73% 58%;
    --secondary-foreground: 240 10% 3.9%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 158 64% 42%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 20%;
    --ring: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Better focus styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Text rendering improvements */
  h1, h2, h3, h4, h5, h6 {
    text-wrap: balance;
  }
  
  p {
    text-wrap: pretty;
  }
}

@layer components {
  /* Glassmorphism card */
  .glass-card {
    @apply bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10;
  }
  
  /* Sparkle button */
  .btn-sparkle {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #8B5CF6, #EC4899, #10B981);
    transition: all 0.3s ease;
  }
  
  .btn-sparkle:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
  }
  
  .btn-sparkle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }
  
  .btn-sparkle:hover::before {
    left: 100%;
  }
  
  /* Badge rarity styles */
  .badge-common {
    @apply bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30;
  }
  
  .badge-uncommon {
    @apply bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30;
  }
  
  .badge-rare {
    @apply bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30;
  }
  
  .badge-epic {
    @apply bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30;
  }
  
  .badge-legendary {
    @apply bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30;
    animation: glow 2s ease-in-out infinite;
  }
  
  .badge-mythic {
    @apply bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30;
    background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2));
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .badge-limited {
    @apply bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30;
    position: relative;
    overflow: hidden;
  }
  
  .badge-seasonal {
    @apply bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30;
  }
  
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-muted rounded-full;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-primary/30 rounded-full hover:bg-primary/50;
    background: linear-gradient(#8B5CF6, #EC4899);
  }
  
  /* Loading skeleton with sparkle effect */
  .skeleton-sparkle {
    @apply relative overflow-hidden bg-muted;
    background: linear-gradient(90deg, 
      rgba(139,92,246,0.1) 0%, 
      rgba(236,72,153,0.2) 50%, 
      rgba(139,92,246,0.1) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Reaction animations */
  .reaction-bounce {
    animation: bounce 0.5s ease-out;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  /* Notification bell */
  .notification-bell {
    @apply relative;
  }
  
  .notification-bell.has-unread::after {
    content: '';
    @apply absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full;
    animation: pulse 2s infinite;
  }
}

@layer utilities {
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Text gradient */
  .text-gradient {
    @apply bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent;
  }
  
  /* Sparkle particle effect */
  .sparkle-effect {
    position: relative;
  }
  
  .sparkle-effect::after {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -10px;
    animation: sparkle 2s ease-in-out infinite;
  }
  
  /* Prevent text selection */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}

/* Animations */
@keyframes glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 
                0 0 40px rgba(236, 72, 153, 0.3);
  }
  50% { 
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 
                0 0 60px rgba(236, 72, 153, 0.5);
  }
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}

/* Micro-interactions */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
}

/* Loading states */
.loading-dots::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}
