type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  environment: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.formatLogEntry(level, message, data);

    // In development, log to console with appropriate styling
    if (this.isDevelopment) {
      const styles = {
        info: 'color: #2196F3',
        warn: 'color: #FFA000',
        error: 'color: #F44336',
        debug: 'color: #9E9E9E'
      };

      const prefix = `%c[${entry.timestamp}] ${entry.level.toUpperCase()}:`;
      const style = styles[level];

      if (data) {
        console.log(prefix, style, message, data);
      } else {
        console.log(prefix, style, message);
      }
    }

    // TODO: In production, send to your logging service
    // Example: await sendToLoggingService(entry);
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

export const logger = Logger.getInstance(); 