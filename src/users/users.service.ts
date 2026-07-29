import { Injectable } from '@nestjs/common';
import {NotImplementedException, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, DeleteUserDto, LoginUserDto, FindOneUserDto } from './dto/users.dto';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { hash, compare } from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    async createUser(user: CreateUserDto): Promise<User> {
        const hashedPassword = await hash(user.password, 10);
        let newUser = this.userRepository.create({email:user.email,password:hashedPassword});
        return await this.userRepository.save(newUser)
    }
    async deleteUser(user: DeleteUserDto): Promise<boolean> {
        let res = await this.userRepository.delete({email: user.email})
        return !!res.affected
    }
    async findOne(email: string): Promise<User | null> {
        const found = await this.userRepository.findOne({where: {email: email}});
        return found;
  }

   async getAllUser(): Promise<User[] | null> {
        const allUser = await this.userRepository.find();
        return allUser;
  }
}   
