import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { File } from './entities/file.entity';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { UserFolders } from 'src/users/entities/user_folders.entity';
import { FolderModule } from 'src/folders/folder.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, Folder, UserFolders]),
    FolderModule,
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
