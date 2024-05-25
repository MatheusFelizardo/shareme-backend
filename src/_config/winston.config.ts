import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss', // Formato da data e hora
    }),
    winston.format.printf(({ timestamp, level, message, context }) => {
      return `${timestamp} [${level}]${context ? ' [' + context + ']' : ''} ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      options: { flags: 'a' },
    }),
    new winston.transports.File({
      filename: 'logs/info.log',
      options: { flags: 'a' },
    }),
  ],
};
