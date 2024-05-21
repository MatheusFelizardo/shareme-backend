import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, fileTypeEnum } from './entities/file.entity';
import { CreateFileDto } from './dtos/create-file.dto';
import * as path from 'path';
import * as fs from 'fs';
import { Folder, FolderType } from 'src/folders/entities/folder.entity';
import {
  UserFolders,
  folderPermissions,
} from 'src/users/entities/user_folders.entity';
import { FolderService } from 'src/folders/folder.service';
import { info, log } from 'console';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    @InjectRepository(UserFolders)
    private userFolderRepository: Repository<UserFolders>,
    private folderService: FolderService,
  ) {}

  async findAll(loggedUserId: number) {
    const files = await this.fileRepository.find({
      where: { creator: { id: loggedUserId } },
      relations: ['folder', 'folder.creator'],
    });

    return files.map((file) => {
      return new CreateFileDto(file, file.folder, file.folder.creator);
    });
  }

  async findFilesInFolderByFolderId(
    folderId: number,
    loggedUserId: number,
    loggedUserEmail: string,
  ) {
    const files = await this.fileRepository.find({
      where: { folder: { id: folderId } },
      relations: ['creator', 'folder', 'folder.creator'],
      withDeleted: true,
    });

    if (files.length === 0) {
      return [];
    }

    const isTheOwner = files[0].folder.creator.id === loggedUserId;
    const hasPermission = await this.userFolderRepository.findOne({
      where: { folder: { id: folderId }, user: { id: loggedUserId } },
      relations: ['user'],
      withDeleted: true,
    });

    if (
      !isTheOwner &&
      !hasPermission &&
      files[0].folder.type === FolderType.private
    ) {
      Logger.error(
        `INVALID REQUEST: ${loggedUserEmail} is trying to access the folder ${folderId} which belongs to ${files[0].folder.creator.email}`,
      );
      throw new Error('You do not have permission to view this folder');
    }

    return files.map((file) => {
      return new CreateFileDto(file, file.folder, file.creator);
    });
  }

  async findFilesInPublicFolderByFolderId(
    folderId: number,
    loggedUserEmail: string,
  ) {
    const files = await this.fileRepository.find({
      where: { folder: { id: folderId } },
      relations: ['creator', 'folder', 'folder.creator'],
      withDeleted: true,
    });

    if (files.length === 0) {
      return [];
    }

    if (files[0].folder.type === FolderType.private) {
      Logger.error(
        `INVALID REQUEST: ${loggedUserEmail} is trying to access the folder ${folderId} which is private and belongs to ${files[0].folder.creator.email}`,
      );

      throw new Error(
        'This folder is private. Please contact the owner to get access.',
      );
    }

    return files.map((file) => {
      return new CreateFileDto(file, file.folder, file.creator);
    });
  }

  /***
   * Upload a file to a folder
   */
  async upload(
    folderId: number,
    files: Express.Multer.File[],
    loggedUserId: number,
  ) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
    });

    if (!folder) {
      throw new Error('Folder not exists');
    }

    const hasPermission = await this.userFolderRepository.findOne({
      where: { folder: { id: folderId }, user: { id: loggedUserId } },
      relations: ['user'],
    });

    if (
      (!hasPermission && folder.creator.id !== loggedUserId) ||
      (hasPermission && hasPermission?.permission === folderPermissions.read)
    ) {
      throw new Error(
        'You do not have permission to upload files to this folder',
      );
    }

    const pathTosave = `./storage/${folder.creator.id}/${folder.path}`;
    const uploadedFilePaths: CreateFileDto[] = [];

    const creator = hasPermission ? hasPermission.user : folder.creator;

    const errors = [];
    for (const file of files) {
      const alreadyExists = await this.fileRepository.findOne({
        where: { path: file.originalname, folder: { id: folderId } },
      });

      if (alreadyExists) {
        errors.push({
          file: file.originalname,
          message: 'File already exists',
        });
        continue;
      }
      await this.moveFile(file, pathTosave);
      const nameWithoutFormat = path.basename(
        file.originalname,
        path.extname(file.originalname),
      );

      const newFile = this.fileRepository.create({
        name: nameWithoutFormat,
        path: file.originalname,
        type: this.getFileType(file),
        file_size: file.size,
        folder,
        creator: creator,
      });
      await this.fileRepository.save(newFile);

      const fileToDto = new CreateFileDto(newFile, folder, creator);

      uploadedFilePaths.push(fileToDto);
    }

    return {
      success: uploadedFilePaths,
      errors: errors,
    };
  }

  async removeFile(fileId: number, loggedUserId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['creator', 'folder', 'folder.creator'],
    });

    if (!file) {
      throw new Error('File not found');
    }

    const hasPermission = await this.hasPermission(
      file.folder.id,
      loggedUserId,
      file,
    );

    if (!hasPermission) {
      throw new Error('You do not have permission to delete this file');
    }

    const path = `./storage/${file.folder.creator.id}/${file.folder.path}/${file.path}`;
    await this.removeFileFromDisk(path);
    await this.fileRepository.remove(file);

    return { message: 'File deleted successfully' };
  }

  async renameFile(fileId: number, name: string, loggedUserId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['creator', 'folder', 'folder.creator'],
    });

    if (!file) {
      throw new Error('File not found');
    }

    const hasPermission = await this.hasPermission(
      file.folder.id,
      loggedUserId,
      file,
    );

    if (!hasPermission) {
      throw new Error('You do not have permission to rename this file');
    }

    const fileOldPath = `./storage/${file.folder.creator.id}/${file.folder.path}/${file.path}`;
    const fileFormat = path.extname(file.path);
    const newNewPath = `./storage/${file.folder.creator.id}/${file.folder.path}/${name}${fileFormat}`;

    await fs.promises.rename(fileOldPath, newNewPath);
    file.path = `${name}${fileFormat}`;
    file.name = name;
    await this.fileRepository.save(file);

    return {
      message: 'File renamed successfully',
      file: {
        id: file.id,
        path: file.path,
        folder: file.folder.id,
      },
    };
  }

  async downloadFile(fileId: number, loggedUserId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['folder', 'folder.creator'],
      withDeleted: true,
    });

    if (!file) {
      throw new Error('File not found');
    }

    const path = `./storage/${file.folder.creator.id}/${file.folder.path}/${file.path}`;

    return {
      sysmtePath: path,
      file: file,
    };
  }

  private async moveFile(
    file: Express.Multer.File,
    pathTosave: string,
  ): Promise<string> {
    if (!fs.existsSync(pathTosave)) {
      fs.mkdirSync(pathTosave, { recursive: true });
    }
    const filename = file.originalname;
    const filePath = path.join(pathTosave, filename);
    await fs.promises.rename(file.path, filePath);

    return filePath;
  }

  private async removeFileFromDisk(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private async hasPermission(
    folderId: number,
    loggedUserId: number,
    file: File,
  ) {
    const hasPermission = await this.userFolderRepository.findOne({
      where: { folder: { id: folderId }, user: { id: loggedUserId } },
      relations: ['user'],
    });

    if (
      (hasPermission && file.creator.id === loggedUserId) ||
      file.folder.creator.id === loggedUserId ||
      hasPermission.permission === folderPermissions.edit
    ) {
      return true;
    }

    return false;
  }

  private getFileType(file: Express.Multer.File) {
    const mimeType = file.mimetype;
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return fileTypeEnum.image;
      case 'application/pdf':
        return fileTypeEnum.pdf;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return fileTypeEnum.doc;
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return fileTypeEnum.xls;
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return fileTypeEnum.ppt;
      case 'text/plain':
        return fileTypeEnum.txt;
      case 'application/zip':
      case 'application/x-zip-compressed':
        return fileTypeEnum.zip;
      default:
        return fileTypeEnum.other;
    }
  }
}
