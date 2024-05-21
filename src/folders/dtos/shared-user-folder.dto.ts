/**
 * Returns the user information to the client.
 */

import { UserFolders } from 'src/users/entities/user_folders.entity';
import { Folder } from '../entities/folder.entity';

export class SharedUserFolderDto {
  id: number;
  permission: string;
  user: {
    id: number;
    name: string;
    lastname: string;
    email: string;
  };
  created_at: Date;
  updated_at: Date;

  constructor(userFolder: UserFolders) {
    this.id = userFolder.id;
    this.permission = userFolder.permission;
    this.user = {
      id: userFolder.user.id,
      name: userFolder.user.name,
      lastname: userFolder.user.lastName,
      email: userFolder.user.email,
    };
    this.created_at = userFolder.created_at;
    this.updated_at = userFolder.updated_at;
  }
}
