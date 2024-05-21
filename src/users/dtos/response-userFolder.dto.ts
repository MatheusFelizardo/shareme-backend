/**
 * Returns the user folder sharing information to the client.
 */

import { Folder } from 'src/folders/entities/folder.entity';
import { User } from '../entities/user.entity';
import { UserFolders } from '../entities/user_folders.entity';

export class ResponseUserFolderDto {
  user: User;
  folder: Folder;

  constructor(userFolder: UserFolders) {
    this.user = userFolder.user;
    this.folder = userFolder.folder;
  }
}
