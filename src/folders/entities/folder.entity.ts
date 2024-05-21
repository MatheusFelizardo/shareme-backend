import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/entities/file.entity';

export enum FolderType {
  private = 'private',
  public = 'public',
}

@Entity()
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  path: string;

  @Column({
    type: 'simple-enum',
    enum: FolderType,
    default: FolderType.private,
  })
  type: FolderType;

  @Column({ nullable: false, default: false })
  is_shared: boolean;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => File, (file) => file.folder, { onDelete: 'CASCADE' })
  files: File[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
