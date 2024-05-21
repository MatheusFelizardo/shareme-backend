import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, roles } from './entities/user.entity';
import { ResponseUserDto } from './dtos/response-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

interface HttpRequestError {
  error: boolean;
  message: string;
}

interface HttpResquestSuccess {
  error: boolean;
  data: ResponseUserDto | ResponseUserDto[] | string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    // if (req.user.role !== roles['admin']) {
    //   return {
    //     error: true,
    //     message: 'Resource only allowed for system admins.',
    //   };
    // }

    try {
      const users = await this.userService.findAll();
      return {
        error: false,
        data: users,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') || 'Error while finding users.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findById(
    @Param('id') id: string,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const user = await this.userService.findById(id);
      return {
        error: false,
        data: user,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') || 'Error while finding user.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const user = await this.userService.createUser(createUserDto, req.user);
      return {
        error: false,
        data: user,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') || 'Error while creating user.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const user = await this.userService.updateUser(id, updateUserDto);

      if (req.user.id !== +id && req.user.role !== roles['admin']) {
        return {
          error: true,
          message:
            'Resource only allowed for system admins or user account holder.',
        };
      }

      return {
        error: false,
        data: user,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while updating user role.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    try {
      const user = await this.userService.updateUserRole(id, updateUserDto);
      if (req.user.role !== roles['admin']) {
        return {
          error: true,
          message: 'Resource only allowed for system admins.',
        };
      }

      return {
        error: false,
        data: user,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') ||
          'Error while updating user role.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUser(
    @Param('id') id: number,
    @Request() req,
  ): Promise<HttpResquestSuccess | HttpRequestError> {
    if (req.user.role !== roles['admin']) {
      return {
        error: true,
        message: 'Resource only allowed for system admins.',
      };
    }

    try {
      const response = await this.userService.deleteUser(id);
      return {
        error: false,
        data: response,
      };
    } catch (err) {
      return {
        error: true,
        message:
          err.message.replace(/^Error:\s*/, '') || 'Error while deleting user.',
      };
    }
  }
}
