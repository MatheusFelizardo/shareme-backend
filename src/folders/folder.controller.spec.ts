import { Test, TestingModule } from '@nestjs/testing';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

describe('FolderController', () => {
  let folderController: FolderController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [FolderService],
    }).compile();

    folderController = app.get<FolderController>(FolderController);
  });

  describe('root', () => {});
});
