
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, DeleteAccountDto, RegisterDto, SignInDto } from './dto/auth.dto';
import { Public } from './public.decorator';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registrierung — legt einen Account an und gibt ein JWT zurück. */
  @ApiResponse({ status: 201, description: 'Account angelegt, JWT im Feld access_token.' })
  @ApiResponse({ status: 409, description: 'E-Mail ist bereits registriert.' })
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** Login — prüft die Zugangsdaten und gibt ein JWT zurück. */
  @ApiResponse({ status: 200, description: 'Login erfolgreich, JWT im Feld access_token.' })
  @ApiResponse({ status: 401, description: 'E-Mail oder Passwort falsch.' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  /** Token-Inhalt anzeigen — Profildaten aus der DB liefert GET /users/me. */
  @ApiResponse({ status: 200, description: 'Token-Inhalt: sub, email, iat, exp.' })
  @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  /** Passwort ändern — aktuelles Passwort dient als Bestätigung. */
  @ApiResponse({ status: 200, description: 'Passwort geändert.' })
  @ApiResponse({ status: 400, description: 'Neues Passwort ist mit dem aktuellen identisch.' })
  @ApiResponse({ status: 401, description: 'Aktuelles Passwort falsch oder Token ungültig.' })
  @HttpCode(HttpStatus.OK)
  @Patch('changePassword')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto): Promise<void> {
    return await this.authService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  /** Eigenen Account löschen — unwiderruflich, Passwort dient als Bestätigung. */
  @ApiResponse({ status: 204, description: 'Account gelöscht, kein Inhalt.' })
  @ApiResponse({ status: 401, description: 'Passwort falsch oder Token ungültig.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('account')
  async deleteAccount(@Request() req, @Body() dto: DeleteAccountDto): Promise<void> {
    return await this.authService.deleteAccount(req.user.sub, dto.password);
  }

}
