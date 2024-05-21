import { Injectable } from '@nestjs/common';

@Injectable()
export class Trim {
  beforeInsert(target: any, propertyKey: string) {
    target[propertyKey] = target[propertyKey].trim();
  }

  beforeUpdate(target: any, propertyKey: string) {
    target[propertyKey] = target[propertyKey].trim();
  }
}
