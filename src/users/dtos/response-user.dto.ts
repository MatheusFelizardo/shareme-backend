/**
 * Returns the user information to the client.
 */

import { User } from '../entities/user.entity';

export class ResponseUserDto {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.lastName = user.lastName;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.created_at;
    this.updatedAt = user.created_at;
  }
}
