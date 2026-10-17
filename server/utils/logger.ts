export const logger = {
  info: (objOrMsg: any, msg?: string) => {
    if (typeof objOrMsg === 'string') console.log(`[INFO] ${objOrMsg}`);
    else console.log(`[INFO] ${msg || ''}`, objOrMsg);
  },
  warn: (objOrMsg: any, msg?: string) => {
    if (typeof objOrMsg === 'string') console.warn(`[WARN] ${objOrMsg}`);
    else console.warn(`[WARN] ${msg || ''}`, objOrMsg);
  },
  error: (objOrMsg: any, msg?: string) => {
    if (typeof objOrMsg === 'string') console.error(`[ERROR] ${objOrMsg}`);
    else console.error(`[ERROR] ${msg || ''}`, objOrMsg);
  },
  debug: (objOrMsg: any, msg?: string) => {
    if (process.env.LOG_LEVEL === 'debug') {
      if (typeof objOrMsg === 'string') console.log(`[DEBUG] ${objOrMsg}`);
      else console.log(`[DEBUG] ${msg || ''}`, objOrMsg);
    }
  },
};

export const httpLogger = (_req: any, _res: any, next: any) => {
  next();
};
