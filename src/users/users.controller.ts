import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, DeleteUserDto, LoginUserDto } from './dto/users.dto';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService){}
    
    @Post()
    async createUser(@Body() user: CreateUserDto) {
        await this.usersService.createUser(user);
    }
    @Post()
    async deleteUser(@Body() user: DeleteUserDto) {
        await this.usersService.deleteUser(user);
    }
    @Get()
    async loginUser(@Body() user: LoginUserDto) {
        await this.usersService.loginUser(user);
    }
}
