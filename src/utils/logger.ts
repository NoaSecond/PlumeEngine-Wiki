// Advanced logging system with colors and emojis
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4
}

interface LogConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean;
  emojis: boolean;
  groupCollapsed: boolean;
}

// Type for log data
type LogData = string | number | boolean | object | Error | null | undefined;

class Logger {
  private config: LogConfig = {
    level: LogLevel.DEBUG,
    timestamp: true,
    colors: true,
    emojis: true,
    groupCollapsed: false
  };

  private styles = {
    debug: 'color: #6B7280; font-weight: normal;',
    info: 'color: #3B82F6; font-weight: bold;',
    warn: 'color: #F59E0B; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    success: 'color: #10B981; font-weight: bold;',
    timestamp: 'color: #9CA3AF; font-size: 11px;',
    component: 'color: #8B5CF6; font-weight: bold;',
    action: 'color: #F97316; font-weight: normal;',
    data: 'color: #06B6D4; font-weight: normal;'
  };

  private emojis = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
    auth: '🔐',
    user: '👤',
    admin: '👑',
    database: '💾',
    network: '🌐',
    file: '📁',
    edit: '✏️',
    delete: '🗑️',
    create: '➕',
    update: '🔄',
    search: '🔍',
    config: '⚙️',
    performance: '⚡',
    security: '🛡️'
  };

  constructor(config?: Partial<LogConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Detect environment
    if (process.env.NODE_ENV === 'production') {
      this.config.level = LogLevel.ERROR;
    }

    this.info('🚀 Logger système initialisé', { config: this.config });
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatTimestamp(): string {
    if (!this.config.timestamp) return '';

    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = now.getMilliseconds().toString().padStart(3, '0');

    return `[${time}.${ms}]`;
  }

  private formatMessage(level: LogLevel, component: string, message: string, emoji?: string): string {
    const timestamp = this.formatTimestamp();
    const levelEmoji = this.config.emojis ? (emoji || this.emojis[LogLevel[level].toLowerCase() as keyof typeof this.emojis]) : '';
    const componentPart = component ? `[${component}]` : '';

    return `${timestamp} ${levelEmoji} ${componentPart} ${message}`;
  }

  private log(level: LogLevel, component: string, message: string, data?: LogData, emoji?: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, component, message, emoji);
    const levelName = LogLevel[level].toLowerCase();
    const style = this.config.colors ? this.styles[levelName as keyof typeof this.styles] : '';

    if (data !== undefined) {
      console.groupCollapsed(`%c${formattedMessage}`, style);
      console.log('📊 Données:', data);
      console.groupEnd();
    } else {
      console.log(`%c${formattedMessage}`, style);
    }
  }

  // Main methods
  debug(message: string, data?: LogData, component = '', emoji?: string): void {
    this.log(LogLevel.DEBUG, component, message, data, emoji);
  }

  info(message: string, data?: LogData, component = '', emoji?: string): void {
    this.log(LogLevel.INFO, component, message, data, emoji);
  }

  warn(message: string, data?: LogData, component = '', emoji?: string): void {
    this.log(LogLevel.WARN, component, message, data, emoji);
  }

  error(message: string, data?: LogData, component = '', emoji?: string): void {
    this.log(LogLevel.ERROR, component, message, data, emoji);
  }

  success(message: string, data?: LogData, component = '', emoji?: string): void {
    this.log(LogLevel.SUCCESS, component, message, data, emoji);
  }

  // Specialized methods with predefined emojis
  auth(message: string, data?: LogData, component = 'Auth'): void {
    this.info(message, data, component, this.emojis.auth);
  }

  user(message: string, data?: LogData, component = 'User'): void {
    this.info(message, data, component, this.emojis.user);
  }

  admin(message: string, data?: LogData, component = 'Admin'): void {
    this.info(message, data, component, this.emojis.admin);
  }

  database(message: string, data?: LogData, component = 'Database'): void {
    this.info(message, data, component, this.emojis.database);
  }

  network(message: string, data?: LogData, component = 'Network'): void {
    this.info(message, data, component, this.emojis.network);
  }

  file(message: string, data?: LogData, component = 'File'): void {
    this.info(message, data, component, this.emojis.file);
  }

  performance(message: string, data?: LogData, component = 'Performance'): void {
    this.info(message, data, component, this.emojis.performance);
  }

  security(message: string, data?: LogData, component = 'Security'): void {
    this.warn(message, data, component, this.emojis.security);
  }

  // Action methods with emojis
  create(message: string, data?: LogData, component = ''): void {
    this.success(message, data, component, this.emojis.create);
  }

  update(message: string, data?: LogData, component = ''): void {
    this.info(message, data, component, this.emojis.update);
  }

  delete(message: string, data?: LogData, component = ''): void {
    this.warn(message, data, component, this.emojis.delete);
  }

  edit(message: string, data?: LogData, component = ''): void {
    this.info(message, data, component, this.emojis.edit);
  }

  search(message: string, data?: LogData, component = ''): void {
    this.debug(message, data, component, this.emojis.search);
  }

  // Log groups
  group(title: string, emoji?: string): void {
    const formattedTitle = emoji ? `${emoji} ${title}` : `📋 ${title}`;
    console.group(`%c${formattedTitle}`, this.styles.component);
  }

  groupCollapsed(title: string, emoji?: string): void {
    const formattedTitle = emoji ? `${emoji} ${title}` : `📋 ${title}`;
    console.groupCollapsed(`%c${formattedTitle}`, this.styles.component);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  // Performance measurement
  time(label: string): void {
    console.time(`⚡ ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`⚡ ${label}`);
  }

  // Data table
  table(data: LogData, label?: string): void {
    if (label) {
      this.info(`Tableau: ${label}`, undefined, 'Data', '📊');
    }
    console.table(data);
  }

  // Call stack trace
  trace(message?: string): void {
    if (message) {
      this.debug(message, undefined, 'Trace', '🔍');
    }
    console.trace();
  }

  // Logger configuration
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Niveau de log défini à: ${LogLevel[level]}`, { level }, 'Logger', '⚙️');
  }

  setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
    this.info('Logger configuration updated', { config: this.config }, 'Logger', '⚙️');
  }

  // Start banner
  banner(appName: string, version: string, env: string): void {
    const styles = [
      'color: #3B82F6; font-size: 20px; font-weight: bold;',
      'color: #6B7280; font-size: 14px;',
      'color: #10B981; font-size: 12px;'
    ];

    console.log('%c🌟 ' + appName, styles[0]);
    console.log('%c📦 Version: ' + version, styles[1]);
    console.log('%c🌍 Environment: ' + env, styles[2]);
    console.log('%c' + '='.repeat(50), 'color: #E5E7EB;');
  }
}

// Global logger instance
export const logger = new Logger();

// Default export
export default logger;

// Expose logger globally in development
if (process.env.NODE_ENV === 'development') {
  (window as typeof window & { logger: typeof logger; LogLevel: typeof LogLevel }).logger = logger;
  (window as typeof window & { logger: typeof logger; LogLevel: typeof LogLevel }).LogLevel = LogLevel;
}
