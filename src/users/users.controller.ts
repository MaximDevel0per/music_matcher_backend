import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { User } from './user.entity';
import { UpdateEmailDto } from './dto/users.dto';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    /** Alle Nutzer auflisten — noch ohne Rollenprüfung, später Admin-only. */
    // @ApiResponse({ status: 200, description: 'Liste aller Nutzer, je id und email.' })
    // @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    // @Get('all')
    // async getAllUsers(): Promise<User[]> {
    //     return await this.usersService.getAllUser();
    // }

    /** Eigenes Profil aus der DB — Identität kommt aus dem JWT. */
    @ApiResponse({ status: 200, description: 'Eigenes Profil mit id und email.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 404, description: 'Zum Token existiert kein Nutzer mehr.' })
    @Get('me')
    async getMe(@Request() req): Promise<User> {
        const me = await this.usersService.findById(req.user.sub);
        if (!me) {
            throw new NotFoundException('Benutzer wurde nicht gefunden');
        }
        return me;
    }

    /** Eigene E-Mail ändern — muss frei sein. */
    @ApiResponse({ status: 200, description: 'Aktualisiertes Profil mit neuer E-Mail.' })
    @ApiResponse({ status: 400, description: 'Keine gültige E-Mail-Adresse.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 409, description: 'E-Mail ist bereits vergeben.' })
    @Patch('me')
    async updateMyEmail(@Request() req, @Body() dto: UpdateEmailDto): Promise<User> {
        return await this.usersService.updateEmail(req.user.sub, dto.email);
    }

    /** Öffentliches Profil eines anderen Nutzers. */
    @ApiResponse({ status: 200, description: 'Öffentliches Profil mit id und email.' })
    @ApiResponse({ status: 400, description: 'Die ID ist keine Zahl.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 404, description: 'Kein Nutzer mit dieser ID.' })
    @Get(':id')
    async getProfile(@Param('id', ParseIntPipe) id: number): Promise<Pick<User, 'id' | 'email'>> {
        const profile = await this.usersService.findPublicProfile(id);
        if (!profile) {
            throw new NotFoundException('Benutzer wurde nicht gefunden');
        }
        return profile;
    }
}
