/**
 * Returns the user information to the client.
 */

import { Folder } from '../entities/folder.entity';

export class ResponseFolderDto {
  id: number;
  name: string;
  path: string;
  type: string;
  is_shared: boolean;
  createdAt: Date;
  updatedAt: Date;
  creator_id: number;

  constructor(folder: Folder) {
    this.id = folder.id;
    this.name = folder.name;
    this.type = folder.type;
    this.path = folder.path;
    this.is_shared = folder.is_shared;
    this.creator_id = folder.creator.id;
    this.createdAt = folder.created_at;
    this.updatedAt = folder.created_at;
  }
}
