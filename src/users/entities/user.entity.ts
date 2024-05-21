import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { File } from '../../files/entities/file.entity';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { UserFolders } from './user_folders.entity';

export enum roles {
  admin = 'admin',
  user = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({
    nullable: false,
    unique: true,
  })
  email: string;

  @Column({
    nullable: false,
  })
  password: string;

  @Column({
    type: 'simple-enum',
    enum: roles,
    default: roles.user,
  })
  role: roles;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async parsePassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
