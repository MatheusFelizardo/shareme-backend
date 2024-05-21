import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, roles } from './entities/user.entity';

describe('UserController', () => {
  let userController: UserController;
  let createdUser: User;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    userController = app.get<UserController>(UserController);
  });

  // it('Show list all users', () => {
  //   expect(userController.findAll()).toBeDefined();
  // });

  // it('Show user by id', () => {
  //   expect(userController.findById('1')).toBeDefined();
  // });

  // it('Create user', () => {
  //   const createdUser = userController.create({
  //     name: 'User',
  //     lastName: 'Test',
  //     password: '123456',
  //     email: 'user.test@test.com',
  //     role: roles['admin'],
  //   });
  //   expect(createdUser).toBeDefined();
  // });

  // it('Update user', () => {
  //   expect(
  //     userController.updateUser('1', {
  //       name: 'User',
  //       lastName: 'Test',
  //       role: roles['admin'],
  //     }),
  //   ).toBeDefined();
  // });

  // it('Delete user', () => {
  //   expect(userController.deleteUser(`${createdUser.id}`)).toBeDefined();
  // });
});
