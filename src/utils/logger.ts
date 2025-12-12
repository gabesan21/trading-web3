/**
 * Log levels for the logger
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Simple structured logger with timestamp and level
 */
export class Logger {
  /**
   * Logs a debug message
   * @param message Log message
   * @param data Additional structured data
   */
  static debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs an info message
   * @param message Log message
   * @param data Additional structured data
   */
  static info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a warning message
   * @param message Log message
   * @param data Additional structured data
   */
  static warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs an error message
   * @param message Log message
   * @param data Additional structured data (can include error object)
   */
  static error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Internal logging method
   * @param level Log level
   * @param message Log message
   * @param data Additional structured data
   */
  private static log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const output = `[${timestamp}] ${level}: ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(output, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(output, data ? data : '');
        break;
      case LogLevel.DEBUG:
      case LogLevel.INFO:
      default:
        console.log(output, data ? data : '');
        break;
    }
  }
}
