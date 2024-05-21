import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Folder } from '../../folders/entities/folder.entity';

export enum fileTypeEnum {
  image = 'image',
  pdf = 'pdf',
  doc = 'doc',
  xls = 'xls',
  ppt = 'ppt',
  txt = 'txt',
  zip = 'zip',
  other = 'other',
}

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column()
  path: string;

  @Column({
    type: 'simple-enum',
    enum: fileTypeEnum,
    default: fileTypeEnum.other,
  })
  type: fileTypeEnum;

  @Column({ nullable: true })
  file_size: number;

  @ManyToOne(() => Folder, (folder) => folder.files, { onDelete: 'CASCADE' })
  @Index('file_folder_id_index')
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => User, (user) => user.id)
  @Index('file_user_id_index')
  @JoinColumn({ name: 'user_id' })
  creator: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
