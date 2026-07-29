import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from './user.entity';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService){}
    
    @Get()
    async getAllUsers(): Promise<User[]|null>{
        const users = await this.usersService.getAllUser();
        return users
    }
   
}
