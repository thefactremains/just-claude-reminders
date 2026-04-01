/**
 * Escape a string for safe interpolation inside JXA template literals.
 */
export declare function escapeJS(str: string): string;
/**
 * Execute a JXA (JavaScript for Automation) script via osascript.
 */
export declare function runJXA<T>(script: string): Promise<T>;
