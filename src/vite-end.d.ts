/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Wake Lock API types
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean
  readonly type: "screen"
  release(): Promise<void>
}

interface WakeLock {
  request(type: "screen"): Promise<WakeLockSentinel>
}

interface Navigator {
  readonly wakeLock?: WakeLock
}