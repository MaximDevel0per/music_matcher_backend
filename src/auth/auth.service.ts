
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const existing = await this.usersService.findOne(dto.email);
    if (existing) {
      throw new ConflictException('E-Mail ist bereits registriert');
    }

    const user = await this.usersService.createUser(dto);
    return this.createToken(user.id, user.email);
  }

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(email);
    if (!user || !(await compare(pass, user.password))) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    return this.createToken(user.id, user.email);
  }

  private async createToken(sub: number, email: string): Promise<{ access_token: string }> {
    const access_token = await this.jwtService.signAsync({ sub, email });
    return { access_token };
  }
}
