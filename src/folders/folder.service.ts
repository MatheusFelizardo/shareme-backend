/***
 * This service is responsible for handling the business logic of the folders module.
 * It is responsible for creating folders, updating folders, deleting folders, and listing folders.
 * These folders are stored in the database and are associated with a user by the email, which is not changeable.
 * The folder is sanitized before being saved in the database. Example: if the folder name is "My Folder", it will be saved as "my_folder".
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder, FolderType } from './entities/folder.entity';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { UserService } from 'src/users/user.service';
import { ResponseFolderDto } from './dtos/response-folder.dto';
import { User } from 'src/users/entities/user.entity';
import {
  UserFolders,
  folderPermissions,
} from 'src/users/entities/user_folders.entity';
import { ResponseUserFolderDto } from 'src/users/dtos/response-userFolder.dto';
import * as fs from 'fs';
import { SharedUserFolderDto } from './dtos/shared-user-folder.dto';

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    @InjectRepository(UserFolders)
    private userFolderRepository: Repository<UserFolders>,
    private userService: UserService,
  ) {}

  /***
   * Create a new folder
   *
   */
  async createFolder(
    createFolderDto: CreateFolderDto,
    userId: number,
  ): Promise<ResponseFolderDto> {
    try {
      const name = createFolderDto.name;
      const folderPath = this.sanitizePath(createFolderDto.name);
      const isPublic = createFolderDto.isPublic;

      const folderExists = await this.findFolderByPath(folderPath, isPublic);
      if (folderExists) {
        this.logger.error(
          `User ${userId} tried to create a folder ${name} that already exists.`,
        );
        throw new Error('Folder already exists');
      }

      const creator = await this.userService.getUserById(userId);

      const data = {
        name: name,
        path: isPublic ? `/public/${folderPath}` : `/private/${folderPath}`,
        type: isPublic ? FolderType.public : FolderType.private,
        creator: creator,
      };

      const folder = this.folderRepository.create(data);
      await this.folderRepository.save(folder);
      this.logger.log(`New folder id ${folder.id} created by user ${userId}`);

      return new ResponseFolderDto(folder);
    } catch (error) {
      this.logger.error(`ERROR creating folder: ${error}`);
      throw new Error(error);
    }
  }

  /***
   * Share a folder with other users.
   *
   */
  async shareFolder(
    folderId: number,
    users: [{ id: string; permission: string }],
    loggedUserId: number,
  ): Promise<{
    success: { user: User; folder: Folder; message: string }[];
    error: { user: User; folder: Folder; message: string }[];
  }> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
      withDeleted: true,
    });

    if (!folder) {
      this.logger.error(
        `Folder ${folderId} not found searched by user ${loggedUserId}`,
      );
      throw new Error('Folder not found');
    }

    const { creator, ...folderResponse } = folder;

    if (folder.creator.id !== loggedUserId) {
      this.logger.error(
        `User ${loggedUserId} tried to share a folder that does not belong to him/her`,
      );
      throw new Error('You do not have permission to share this folder');
    }

    const usersList = await this.userService.findMultipleUsersByIds(users);
    if (usersList.length !== users.length) {
      this.logger.error(
        `While trying to share folder ${folderId} with users ${users} some users were not found.`,
      );
      throw new Error('One or more users were not found');
    }

    const sharedFolderResponse = {
      success: [],
      error: [],
    };

    for (const user of usersList) {
      const existingRelation = await this.userFolderRepository.findOne({
        where: { user: { id: user.id }, folder: { id: folderId } },
      });

      if (existingRelation) {
        sharedFolderResponse.error.push({
          user,
          folder: folderResponse,
          message: `User ${user.email} already has access to this folder`,
        });
        continue;
      }

      if (user.id === loggedUserId) {
        sharedFolderResponse.error.push({
          user,
          folder: folderResponse,
          message: `You cannot share this folder with yourself`,
        });
        continue;
      }

      const data = [];
      users.forEach((u) => {
        if (+u.id === user.id) {
          data.push({
            user,
            permission: folderPermissions[u.permission],
            folder,
          });
        }
      });
      const sharedFolder = this.userFolderRepository.create(data);
      sharedFolder.forEach(async (sf) => {
        await this.userFolderRepository.save(sf);
      });

      folder.is_shared = true;
      await this.folderRepository.save(folder);
      const folderToDto = new ResponseFolderDto(folder);

      sharedFolderResponse.success.push({
        user,
        folderToDto,
        message: `Folder ${folderId} shared with user ${user.email}`,
      });
    }

    return sharedFolderResponse;
  }

  /***
   * Find a folder by its path.
   */

  async findFolderByPath(name: string, isPublic: boolean): Promise<Folder> {
    const folderPath = isPublic ? `/public/${name}` : `/private/${name}`;
    const folder = await this.folderRepository.findOne({
      where: { path: folderPath },
    });

    return folder;
  }

  async findPublicFoldersByEmail(email: string) {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }
    const userId = user.id;
    const folders = await this.folderRepository.find({
      where: { creator: { id: userId }, type: FolderType.public },
    });

    return folders;
  }

  /***
   * Trim the folder name and replace spaces with underscores.
   */
  sanitizePath(path: string): string {
    return path.trim().replace(/\s/g, '_').toLowerCase();
  }

  /***
   * Updates a folder permission for a specific user.
   * The user must be the creator of the folder to update it.
   */

  async updateUserFolderPermission(
    data: {
      folderId: number;
      userId: number;
      permission: string;
    },
    userId: number,
  ): Promise<UserFolders> {
    const userFolder = await this.userFolderRepository.findOne({
      where: { folder: { id: data.folderId }, user: { id: data.userId } },
      relations: ['user'],
    });

    if (!userFolder) {
      throw new Error(
        `There is no shared folder with id ${data.folderId} for user ${data.userId}`,
      );
    }

    if (userId !== userFolder.user.id) {
      this.logger.error(
        `User ${userId} tried to update permission for a folder (${data.folderId}) that does not belong to him/her. `,
      );
      throw new Error('You do not have permission to update this folder');
    }

    userFolder.permission = folderPermissions[data.permission];
    await this.userFolderRepository.save(userFolder);

    return userFolder;
  }

  /***
   * Removes a shared folder from a user.
   * The user must be the creator of the folder to remove the shared folder.
   */

  async removeSharedFolder(
    data: {
      folderId: number;
      userId: number;
    },
    loggedUserId: number,
  ): Promise<UserFolders> {
    const folder = await this.folderRepository.findOne({
      where: { id: data.folderId },
      relations: ['creator'],
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.creator.id !== loggedUserId) {
      this.logger.error(
        `User ${loggedUserId} tried to update permission for a folder (${data.folderId}) that does not belong to him/her. `,
      );
      throw new Error('You are not allowed to remove this folder permissions');
    }

    const userFolder = await this.userFolderRepository.findOne({
      where: { folder: { id: data.folderId }, user: { id: data.userId } },
      relations: ['folder', 'user'],
    });

    if (!userFolder) {
      throw new Error(
        `User ${data.userId} does not have access to this folder`,
      );
    }

    await this.userFolderRepository.remove(userFolder);

    const hasSharedFolders = await this.userFolderRepository.find({
      where: { folder: { id: data.folderId } },
    });
    if (hasSharedFolders.length === 0) {
      folder.is_shared = false;
      await this.folderRepository.save(folder);
    }

    return userFolder;
  }

  /***
   * Returns all folders
   */

  async findAll(userId: number): Promise<ResponseFolderDto[]> {
    const folders = await this.folderRepository.find({
      where: { creator: { id: userId } },
      relations: ['creator'],
    });

    const folderToDto = folders.map((folder) => new ResponseFolderDto(folder));

    return folderToDto;
  }

  /***
   * Returns all folders of he logged user that is shared with other users
   */

  async getAllSharedFolders(userId: number): Promise<ResponseUserFolderDto[]> {
    const userFolders = await this.userFolderRepository.find({
      relations: ['folder'],
    });

    const folders = await this.findAll(userId);
    const loggedUserSharedFolders = [];

    for (const folder of folders) {
      for (const userFolder of userFolders) {
        if (userFolder.folder.id === folder.id) {
          if (loggedUserSharedFolders.includes(folder)) continue;
          loggedUserSharedFolders.push(folder);
        }
      }
    }
    return loggedUserSharedFolders;
  }

  async isFolderOwner(folderId: number, userId: number): Promise<boolean> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
      withDeleted: true,
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    return folder.creator.id === userId;
  }

  async renameFolder(folderId: number, name: string, userId: number) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
      withDeleted: true,
    });

    const userPermission = await this.userFolderRepository.findOne({
      where: { folder: { id: folderId }, user: { id: userId } },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (
      (folder.creator.id !== userId && !userPermission) ||
      (userPermission && userPermission.permission !== folderPermissions.edit)
    ) {
      this.logger.error(
        `User ${userId} tried to rename a folder (${folderId}) without access permission.`,
      );
      throw new Error('You do not have permission to rename this folder');
    }

    const oldPathStorage = `./storage/${folder.creator.id}/${folder.path}`;
    const newPathStorage = `./storage/${folder.creator.id}/${folder.type}/${this.sanitizePath(name)}`;

    folder.name = name;
    folder.path = `/${folder.type}/${this.sanitizePath(name)}`;
    await this.renameFolderOnDisk(oldPathStorage, newPathStorage);
    await this.folderRepository.save(folder);
    this.logger.log(`Folder ${folderId} renamed by user ${userId}`);

    return folder;
  }

  async removeFolder(folderId: number, userId: number) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
      withDeleted: true,
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.creator.id !== userId) {
      this.logger.error(
        `User ${userId} tried to delete a folder (${folderId}) without access permission.`,
      );
      throw new Error('You do not have permission to remove this folder');
    }

    const userFolders = await this.userFolderRepository.find({
      where: { folder: { id: folderId } },
    });

    const pathStorage = `./storage/${userId}/${folder.path}`;
    await this.deleteFolderFromDisk(pathStorage);
    await this.userFolderRepository.remove(userFolders);
    await this.folderRepository.remove(folder);
    this.logger.log(`Folder ${folderId} removed by user ${userId}`);

    return {
      message: 'Folder removed successfully',
      folder: {
        id: folder.id,
        path: folder.path,
      },
    };
  }

  // This method is responsible for getting the user whom the folder is shared with.
  async getSharedUsers(folderId: number, userId: number) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['creator'],
      withDeleted: true,
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.creator.id !== userId) {
      this.logger.error(
        `User ${userId} tried to access a folder (${folderId}) without permission.`,
      );
      throw new Error('You do not have permission to view this folder');
    }

    const userFolders = await this.userFolderRepository.find({
      where: { folder: { id: folderId } },
      relations: ['user'],
    });

    const userFoldersToDto = userFolders.map(
      (uf) => new SharedUserFolderDto(uf),
    );

    return userFoldersToDto;
  }

  // get folder shared with me
  async getFoldersSharedWithMe(userId: number) {
    const userFolders = await this.userFolderRepository.find({
      where: { user: { id: userId } },
      relations: ['folder', 'folder.creator'],
      withDeleted: true,
    });

    const folders = userFolders.map((uf) => uf.folder);
    const foldersToDto = folders.map((folder) => new ResponseFolderDto(folder));
    return foldersToDto;
  }

  private async renameFolderOnDisk(oldPath: string, newPath: string) {
    if (fs.existsSync(newPath)) {
      throw new Error('Folder already exists in the directory');
    }

    if (fs.existsSync(oldPath)) {
      try {
        fs.renameSync(oldPath, newPath);
      } catch (err) {
        throw new Error('Error while renaming folder');
      }
    }
  }

  private async deleteFolderFromDisk(path: string) {
    if (fs.existsSync(path)) {
      try {
        fs.rmSync(path, { recursive: true, force: true });
      } catch (err) {
        throw new Error('Error while removing folder');
      }
    }
  }
}
