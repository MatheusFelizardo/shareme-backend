import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, roles } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { ResponseUserDto } from './dtos/response-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<ResponseUserDto[]> {
    try {
      const users = await this.userRepository.find();
      const toDto = users.map((user) => new ResponseUserDto(user));
      return toDto;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findById(id: string): Promise<ResponseUserDto | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +id },
      });

      if (!user) {
        this.logger.error(`User ${id} not found.`);
        throw new Error('User not found.');
      }
      return new ResponseUserDto(user);
    } catch (error) {
      this.logger.error(`ERROR find user by id ${id}: ${error} `);
      throw new Error(error);
    }
  }

  async findByEmail(email: string): Promise<ResponseUserDto | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error('User not found.');
      }
      return new ResponseUserDto(user);
    } catch (error) {
      this.logger.error(`ERROR find user by email ${email}: ${error} `);
      throw new Error(error);
    }
  }

  async createUser(
    createUserDto: CreateUserDto,
    user: User,
  ): Promise<ResponseUserDto> {
    // if (user.role !== roles.admin) {
    //   throw new Error('Resource only allowed for system admins.');
    // }
    try {
      createUserDto.name = createUserDto.name.trim();
      createUserDto.lastName = createUserDto.lastName.trim();
      createUserDto.email = createUserDto.email.trim();
      createUserDto.password = createUserDto.password.trim();

      const userExists = await this.userRepository.findOne({
        where: { email: createUserDto.email },
        withDeleted: true,
      });

      if (userExists) {
        if (!userExists.deleted_at) {
          throw new Error('User already exists.');
        }
        throw new Error('User previous deleted, please contact support.');
      }

      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      this.logger.log(
        `New user created with email: ${user.email} and id ${user.id}`,
      );
      const userToDto = new ResponseUserDto(user);

      return userToDto;
    } catch (error) {
      this.logger.error(`ERROR creating user: ${error} `);
      throw new Error(error);
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +id },
      });

      if (!user) {
        throw new Error('User not found.');
      }
      const updatableFields = {
        name: updateUserDto.name || user.name,
        lastName: updateUserDto.lastName || user.lastName,
      };
      const updatedUser = await this.userRepository.save({
        ...user,
        ...updatableFields,
      });
      const responseUserDto = new ResponseUserDto(updatedUser);
      return responseUserDto;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateUserRole(
    id: string,
    updateUserDto: UpdateUserDto,
    loggedUserEmail: string,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +id },
      });

      if (!user) {
        throw new Error('User not found.');
      }

      if (!roles[updateUserDto.role]) {
        throw new Error('Role not found.');
      }

      const updatableFields = {
        role: roles[updateUserDto.role] ? roles[updateUserDto.role] : user.role,
      };
      const updatedUser = await this.userRepository.save({
        ...user,
        ...updatableFields,
      });
      this.logger.log(
        `Role updated for user ${updatedUser.email} to ${updatedUser.role} requested by ${loggedUserEmail}`,
      );
      const responseUserDto = new ResponseUserDto(updatedUser);
      return responseUserDto;
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteUser(id: number, loggedUserEmail: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
      });

      if (!user) {
        throw new Error('User not found.');
      }

      await this.userRepository.softDelete({ id });
      this.logger.log(`User ${id} deleted by ${loggedUserEmail}`);
      return `User ${id} deleted successfuly.`;
    } catch (error) {
      throw new Error(error);
    }
  }

  // The methods bellow are used internaly by other services
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    return user;
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async getAllUsers(): Promise<ResponseUserDto[]> {
    const users = await this.userRepository.find();
    const usersToDto = users.map((user) => new ResponseUserDto(user));
    return usersToDto;
  }

  async findMultipleUsersByIds(
    users: [{ id: string }],
  ): Promise<ResponseUserDto[]> {
    const usersArray = [];

    for (const user of users) {
      const userFound = await this.getUserById(+user.id);
      if (!userFound) {
        throw new Error('User not found');
      }
      usersArray.push(userFound);
    }

    const usersToDto = usersArray.map((user) => new ResponseUserDto(user));
    return usersToDto;
  }

  async updatePassword(
    userId: number,
    hashedPassword: string,
  ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.password = hashedPassword;
    await this.userRepository.save(user);
    return new ResponseUserDto(user);
  }
}
