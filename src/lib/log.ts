/**
 * Centralized logging utilities
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Formats log messages with context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Info level logging
 */
export function logInfo(message: string, context?: LogContext): void {
  console.info(formatLog('info', message, context));
}

/**
 * Warning level logging
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(formatLog('warn', message, context));
}

/**
 * Error level logging
 */
export function logError(message: string, error?: Error | any, context?: LogContext): void {
  const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
  console.error(formatLog('error', message, errorContext));
}

/**
 * Debug level logging (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (import.meta.env.DEV) {
    console.debug(formatLog('debug', message, context));
  }
}

/**
 * Logs Supabase errors in a standardized way
 */
export function logSupabaseError(operation: string, error: any, context?: LogContext): void {
  logError(`Supabase ${operation} failed`, error, {
    ...context,
    supabaseError: true,
    errorCode: error?.code,
    errorDetails: error?.details,
  });
}

/**
 * Logs network/fetch errors
 */
export function logNetworkError(url: string, error: any, context?: LogContext): void {
  logError(`Network request failed: ${url}`, error, {
    ...context,
    networkError: true,
    url,
  });
}