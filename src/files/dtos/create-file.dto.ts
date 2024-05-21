import { IsNotEmpty } from 'class-validator';
import { File } from '../entities/file.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { User } from 'src/users/entities/user.entity';

export class CreateFileDto {
  id: number;
  name: string;
  path: string;
  type: string;
  creator_name: string;
  creator_id: number;
  folder_id: number;
  size: number;
  created_at: Date;
  updated_at: Date;

  constructor(file: File, folder: Folder, user: User) {
    this.id = file.id;
    this.name = file.name;
    this.size = file.file_size;
    this.type = file.type;
    this.path = file.path;
    this.creator_id = user.id;
    this.folder_id = folder.id;
    this.creator_name = user.name;
    this.created_at = file.created_at;
    this.updated_at = file.updated_at;
  }
}
