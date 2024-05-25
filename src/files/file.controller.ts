import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async findAll(@Request() req) {
    try {
      const files = await this.fileService.findAll(req.user.id);
      return {
        error: false,
        data: files,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching files.',
      };
    }
  }

  @Get('/folder/:folder_id')
  async findByFolderId(@Request() req, @Param('folder_id') folder_id: number) {
    try {
      const files = await this.fileService.findFilesInFolderByFolderId(
        folder_id,
        req.user.id,
        req.user.email,
      );
      return {
        error: false,
        data: files,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching files.',
      };
    }
  }

  @Get('/folder/public/:folder_id')
  async findFilesInPublicFolderByFolderId(
    @Param('folder_id') folder_id: number,
    @Request() req,
  ) {
    try {
      const files = await this.fileService.findFilesInPublicFolderByFolderId(
        folder_id,
        req.user.email,
      );
      return {
        error: false,
        data: files,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while fetching files.',
      };
    }
  }
  /***
   * Upload files to a folder.
   * It creates a temporary folder in the uploads folder to store the files and then the files are moved to the folder.
   * Only allowed users can upload files to the folder. (folder owner and users with edit permission)
   */

  @Post('/upload')
  @UseInterceptors(
    AnyFilesInterceptor({
      dest: './uploads',
    }),
  )
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Query('folder_id') folder_id: number,
    @Request() req,
  ): Promise<any> {
    try {
      const file = await this.fileService.upload(folder_id, files, req.user.id);
      return {
        error: false,
        data: file,
      };
    } catch (err) {
      files.forEach((file) => {
        fs.unlinkSync(file.path);
      });

      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while removing shared folder.',
      };
    }
  }

  @Delete('/remove/:id')
  async remove(@Request() req, @Param('id') file_id: number) {
    try {
      const file = await this.fileService.removeFile(file_id, req.user.id);
      return {
        error: false,
        data: file,
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

  @Put('/rename/:id')
  async rename(
    @Request() req,
    @Param('id') file_id: number,
    @Body('name') name: string,
  ) {
    try {
      const file = await this.fileService.renameFile(
        file_id,
        name,
        req.user.id,
      );
      return {
        error: false,
        data: file,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while renaming the file.',
      };
    }
  }

  @Get('/download/:fileId')
  async downloadFile(
    @Res() res: Response,
    @Param('fileId') fileId: number,
    @Request() req,
  ) {
    try {
      const data = await this.fileService.downloadFile(fileId, req.user.id);

      if (!fs.existsSync(data.sysmtePath)) {
        throw new NotFoundException('File not found');
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${data.file.path}"`,
      );

      const fileStream = fs.createReadStream(data.sysmtePath);
      fileStream.pipe(res);
      // fileStream.pipe(res);
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while downloading the file.',
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const file = await this.fileService.findOne(+id, req.user.id);
      return {
        error: false,
        data: file,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') || 'Error while fetching file.',
      };
    }
  }
}
