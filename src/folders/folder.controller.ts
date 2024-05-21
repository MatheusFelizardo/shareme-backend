import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Put,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  Logger,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { Folder } from './entities/folder.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseFolderDto } from './dtos/response-folder.dto';
import { ResponseUserFolderDto } from 'src/users/dtos/response-userFolder.dto';
import { UserFolders } from 'src/users/entities/user_folders.entity';
import { User } from 'src/users/entities/user.entity';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SharedUserFolderDto } from './dtos/shared-user-folder.dto';

interface HttpRequestError {
  error: boolean;
  message: string;
}

interface ShareFolderResponse {
  success: { user: User; folder: Folder; message: string }[];
  error: { user: User; folder: Folder; message: string }[];
}

interface HttpResquestSuccess {
  error: boolean;
  data:
    | Folder
    | Folder[]
    | string
    | ResponseFolderDto
    | ResponseFolderDto[]
    | ResponseUserFolderDto[]
    | UserFolders[]
    | UserFolders
    | ShareFolderResponse
    | SharedUserFolderDto[]
    | SharedUserFolderDto;
}

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  /***
   * Get all folders of the logged user
   */
  @Get()
  async findAll(
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folders = await this.folderService.findAll(req.user.id);
      return {
        error: false,
        data: folders,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching folders.',
      };
    }
  }

  @Get('public')
  async getPublicFoldersByEmail(
    @Query('profile') email: string,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folders = await this.folderService.findPublicFoldersByEmail(email);
      return {
        error: false,
        data: folders,
      };
    } catch (err) {
      Logger.error(err);
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching public folders.',
      };
    }
  }

  /***
   * Get all folders of the logged user that are shared with other users
   */
  @Get('/shared')
  async getAllSharedFolders(
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folders = await this.folderService.getAllSharedFolders(req.user.id);
      return {
        error: false,
        data: folders,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching folders.',
      };
    }
  }

  /***
   * Get all folders shared with me (given user)
   */
  @Get('/shared/me')
  async getSharedWithMe(
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folders = await this.folderService.getFoldersSharedWithMe(
        req.user.id,
      );
      return {
        error: false,
        data: folders,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching folders.',
      };
    }
  }

  /***
   * Create a new folder for the logged user
   */
  @Post()
  async create(
    @Body() createFolderDto: CreateFolderDto,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folder = await this.folderService.createFolder(
        createFolderDto,
        req.user.id,
      );
      return {
        error: false,
        data: folder,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while creating folder.',
      };
    }
  }

  /***
   * Share a folder with other users
   */
  @Post('/:id/share')
  async shareFolder(
    @Param('id') folderId: number,
    @Body('users') users: [{ id: string; permission: string }],
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const response = await this.folderService.shareFolder(
        folderId,
        users,
        req.user.id,
      );
      return {
        error: false,
        data: response,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while sharing folder.',
      };
    }
  }

  /***
   * Update the permission of other users in the folder
   */
  @Put('/share/update')
  async updatePermission(
    @Body() data: { folderId: number; userId: number; permission: string },
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folder = await this.folderService.updateUserFolderPermission(
        data,
        req.user.id,
      );
      return {
        error: false,
        data: folder,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while sharing folder.',
      };
    }
  }

  /***
   * Remove shared folder from the user
   */
  @Delete('/shared/remove')
  async removeSharedFolder(
    @Body() data: { folderId: number; userId: number },
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folder = await this.folderService.removeSharedFolder(
        data,
        req.user.id,
      );
      if (!folder) {
        throw new Error(
          `Something went wrong while removing shared folder ${data.folderId} for the user ${data.userId}.`,
        );
      }
      return {
        error: false,
        data: `Folder ${data.folderId} removed from user ${data.userId}`,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while removing shared folder.',
      };
    }
  }

  @Put('/:id/rename')
  async rename(
    @Param('id') folderId: number,
    @Body('name') name: string,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const folder = await this.folderService.renameFolder(
        folderId,
        name,
        req.user.id,
      );
      return {
        error: false,
        data: folder,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while renaming folder.',
      };
    }
  }

  @Delete('/:id')
  async remove(@Request() req, @Param('id') folderId: number) {
    try {
      const folder = await this.folderService.removeFolder(
        folderId,
        req.user.id,
      );
      return {
        error: false,
        data: folder,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while removing folder.',
      };
    }
  }

  @Get('/:id/shared/users')
  async getSharedUsers(
    @Request() req,
    @Param('id') folderId: number,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const users = await this.folderService.getSharedUsers(
        folderId,
        req.user.id,
      );
      return {
        error: false,
        data: users,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching shared users.',
      };
    }
  }
}
