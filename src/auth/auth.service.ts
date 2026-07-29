
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import { User } from 'src/users/user.entity';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    if (await this.usersService.existsByEmail(dto.email)) {
      throw new ConflictException('E-Mail ist bereits registriert');
    }

    const hashedPass = await hash(dto.password, 10);
    const user = await this.usersService.createUser(dto.email, hashedPass);
    return this.createToken(user.id, user.email);
  }

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !(await compare(pass, user.password))) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    return this.createToken(user.id, user.email);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if(!user) {
      throw new NotFoundException("Benutzer wurde nicht gefunden");
    }

    await this.validatePassword(user, currentPassword, newPassword);
    const hashedPass = await hash(newPassword, 10)
    await this.usersService.updatePassword(user.id, hashedPass);
  }

  /** Löscht den eigenen Account. Das Passwort dient als Bestätigung. */
  async deleteAccount(userId: number, password: string): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user || !(await compare(password, user.password))) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    await this.usersService.deleteById(user.id);
  }

  private async createToken(sub: number, email: string): Promise<{ access_token: string }> {
    const access_token = await this.jwtService.signAsync({ sub, email });
    return { access_token };
  }

  private async validatePassword(user: User | null, currentPassword: string, newPassword: string) {
  if (!user || !(await compare(currentPassword, user.password))) {
    throw new UnauthorizedException('Ungültige Zugangsdaten');
  }
  if (currentPassword === newPassword) {
    throw new BadRequestException('Das neue Passwort muss sich vom aktuellen unterscheiden');
  }
}
}
