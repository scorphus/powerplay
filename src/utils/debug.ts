const DEBUG = import.meta.env.DEV

export function debug(...args: any[]) {
  if (DEBUG) {
    console.log(...args)
  }
}

export function debugError(...args: any[]) {
  if (DEBUG) {
    console.error(...args)
  }
}
