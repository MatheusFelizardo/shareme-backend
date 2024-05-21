import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Folder } from './entities/folder.entity';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { UserModule } from 'src/users/user.module';
import { UserFolders } from 'src/users/entities/user_folders.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, UserFolders]), UserModule],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
