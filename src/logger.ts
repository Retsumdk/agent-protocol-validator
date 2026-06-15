/**
 * agent-protocol-validator - Logger Utility
 * @author Retsumdk
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  public static setLevel(level: LogLevel) {
    this.level = level;
  }

  public static debug(message: string, context?: any) {
    if (this.level <= LogLevel.DEBUG) {
      this.log("DEBUG", message, context);
    }
  }

  public static info(message: string, context?: any) {
    if (this.level <= LogLevel.INFO) {
      this.log("INFO", message, context);
    }
  }

  public static warn(message: string, context?: any) {
    if (this.level <= LogLevel.WARN) {
      this.log("WARN", message, context);
    }
  }

  public static error(message: string, context?: any) {
    if (this.level <= LogLevel.ERROR) {
      this.log("ERROR", message, context);
    }
  }

  private static log(level: string, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const ctxString = context ? ` | ${JSON.stringify(context)}` : "";
    console.log(`[${timestamp}] [${level}] ${message}${ctxString}`);
  }
}
