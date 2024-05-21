import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Folder } from '../../folders/entities/folder.entity';
import { User } from './user.entity';

export enum folderPermissions {
  read = 'read',
  edit = 'edit',
}

@Entity('user_folders')
export class UserFolders {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user)
  @JoinColumn({ name: 'user_id' })
  @Index('user_folders_user_id_index')
  user: User;

  @ManyToOne(() => Folder, (folder) => folder)
  @JoinColumn({ name: 'folder_id' })
  @Index('user_folders_folder_id_index')
  folder: Folder;

  @Column({
    type: 'simple-enum',
    enum: folderPermissions,
    default: folderPermissions.read,
  })
  permission: folderPermissions;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
