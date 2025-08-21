// src/types/global.d.ts

/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

// YouTube API Global Types
interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
  dataLayer: any[];
  gtag?: (...args: any[]) => void;
}

declare namespace YT {
  interface Player {
    new (elementId: string | HTMLElement, config: PlayerOptions): Player;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): PlayerState;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    getAvailablePlaybackRates(): number[];
    getVideoUrl(): string;
    getVideoEmbedCode(): string;
    getPlaylist(): string[];
    getPlaylistIndex(): number;
    nextVideo(): void;
    previousVideo(): void;
    playVideoAt(index: number): void;
    loadVideoById(videoId: string, startSeconds?: number): void;
    loadVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;
    cueVideoById(videoId: string, startSeconds?: number): void;
    cueVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;
    destroy(): void;
    addEventListener(event: string, listener: Function): void;
    removeEventListener(event: string, listener: Function): void;
  }
  
  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    host?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }
  
  interface PlayerVars {
    autoplay?: 0 | 1;
    cc_lang_pref?: string;
    cc_load_policy?: 0 | 1;
    color?: 'red' | 'white';
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'search' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playerapiid?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  }
  
  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
    onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
    onApiChange?: (event: PlayerEvent) => void;
  }
  
  interface PlayerEvent {
    target: Player;
    data?: any;
  }
  
  interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }
  
  interface OnPlaybackQualityChangeEvent extends PlayerEvent {
    data: string;
  }
  
  interface OnPlaybackRateChangeEvent extends PlayerEvent {
    data: number;
  }
  
  interface OnErrorEvent extends PlayerEvent {
    data: number;
  }
  
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
  
  enum PlayerError {
    INVALID_PARAM = 2,
    HTML5_ERROR = 5,
    VIDEO_NOT_FOUND = 100,
    EMBED_NOT_ALLOWED = 101,
    EMBED_NOT_ALLOWED_2 = 150,
  }
}

// Algolia Search Types
declare module 'algoliasearch' {
  export interface SearchClient {
    initIndex(indexName: string): SearchIndex;
  }
  
  export interface SearchIndex {
    search(query: string, options?: any): Promise<any>;
    saveObjects(objects: any[]): Promise<any>;
    deleteObjects(objectIDs: string[]): Promise<any>;
    clearObjects(): Promise<any>;
  }
}

// Recharts Custom Types
declare module 'recharts' {
  export interface CustomTooltipProps<TValue, TName> {
    active?: boolean;
    payload?: Array<{
      value: TValue;
      name: TName;
      color?: string;
      dataKey?: string;
      payload?: any;
    }>;
    label?: string;
  }
}

// Next Themes Types Extension
declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    themes?: string[];
    forcedTheme?: string;
    enableColorScheme?: boolean;
    scriptProps?: React.HTMLAttributes<HTMLScriptElement>;
    nonce?: string;
  }
  
  export interface UseThemeProps {
    theme?: string;
    setTheme: (theme: string) => void;
    systemTheme?: string;
    themes: string[];
    forcedTheme?: string;
    resolvedTheme?: string;
  }
}

// Custom Event Types for Sparkle Universe
interface SparkleCustomEvents {
  'sparkle:notification': CustomEvent<{
    type: string;
    message: string;
    userId?: string;
  }>;
  'sparkle:achievement': CustomEvent<{
    achievementId: string;
    userId: string;
    rarity: string;
  }>;
  'sparkle:level-up': CustomEvent<{
    userId: string;
    oldLevel: number;
    newLevel: number;
  }>;
  'sparkle:points-earned': CustomEvent<{
    userId: string;
    points: number;
    type: 'sparkle' | 'premium';
  }>;
}

// Extend global Window EventMap
declare global {
  interface WindowEventMap extends SparkleCustomEvents {}
  
  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DIRECT_URL?: string;
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GITHUB_CLIENT_ID?: string;
      GITHUB_CLIENT_SECRET?: string;
      DISCORD_CLIENT_ID?: string;
      DISCORD_CLIENT_SECRET?: string;
      TWITTER_CLIENT_ID?: string;
      TWITTER_CLIENT_SECRET?: string;
      YOUTUBE_API_KEY?: string;
      REDIS_URL?: string;
      REDIS_PASSWORD?: string;
      UPLOADTHING_SECRET?: string;
      UPLOADTHING_APP_ID?: string;
      OPENAI_API_KEY?: string;
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_WS_URL?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  // Utility types
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;
  
  // JSON compatible types
  type JsonPrimitive = string | number | boolean | null;
  type JsonObject = { [key: string]: JsonValue };
  type JsonArray = JsonValue[];
  type JsonValue = JsonPrimitive | JsonObject | JsonArray;
  
  // Common patterns
  type AsyncFunction<T = void> = () => Promise<T>;
  type AsyncFunctionWithArgs<Args, Return = void> = (args: Args) => Promise<Return>;
  type VoidFunction = () => void;
  type Callback<T = void> = (error: Error | null, result?: T) => void;
  
  // React patterns
  type PropsWithClassName<P = {}> = P & { className?: string };
  type PropsWithChildren<P = {}> = P & { children?: React.ReactNode };
}

// Module declarations for assets
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.webm' {
  const content: string;
  export default content;
}

declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}

export {};
