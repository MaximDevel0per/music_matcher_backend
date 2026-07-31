import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Request,
    Res,
    StreamableFile,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProduces, ApiResponse } from '@nestjs/swagger';
// import type: bei isolatedModules + emitDecoratorMetadata darf ein nur als
// Typ verwendeter Import nicht in der Signatur eines Dekorators landen.
import type { Response } from 'express';
import { TrackService } from './track.service';
import { RenameTrackDto, TrackResponseDto, UploadTrackDto } from './dto/track.dto';
import { rename } from 'fs';

@ApiBearerAuth()
@Controller('track')
export class TrackController{
    constructor(private trackservice: TrackService) {}

    /** Lädt eine Audiodatei ins Bucket und legt den Bibliothekseintrag an. */
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string', example: 'Referenz — Drums' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Track angelegt.', type: TrackResponseDto })
    @ApiResponse({ status: 400, description: 'Keine Datei mitgeschickt oder kein Audioformat.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 413, description: 'Die Datei überschreitet MAX_UPLOAD_MB.' })
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadTrack(
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadTrackDto,
    ): Promise<TrackResponseDto> {
        // Fehlt das Formularfeld "file", liefert Multer still undefined.
        if (!file) {
            throw new BadRequestException('Es wurde keine Datei mitgeschickt');
        }

        const track = await this.trackservice.create(req.user.sub, file, dto.title);
        return TrackResponseDto.from(track);
    }

    /** Die eigene Bibliothek, neueste zuerst. */
    @ApiResponse({ status: 200, description: 'Eigene Tracks.', type: [TrackResponseDto] })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @Get()
    async findAllByUser(@Request() req): Promise<TrackResponseDto[]>{
        const tracks = await this.trackservice.findAllByUser(req.user.sub);
        return tracks.map(TrackResponseDto.from);
    }

    /**
     * Liefert die Audiodaten aus. Der Endpunkt ist geschützt — die URL lässt
     * sich deshalb nicht direkt in ein <audio src="…"> schreiben, sondern muss
     * per fetch mit Authorization-Header geholt werden.
     */
    @ApiProduces('audio/*')
    @ApiResponse({ status: 200, description: 'Audiodaten als Stream.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 404, description: 'Kein eigener Track mit dieser ID.' })
    @Get(':id/audio')
    async streamAudio(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { track, stream } = await this.trackservice.openAudio(id, req.user.sub);

        res.set({
            'Content-Type': track.mimeType,
            // Aus der DB — stimmt, solange niemand am Bucket vorbei etwas ändert.
            'Content-Length': String(track.sizeBytes),
            // filename* mit UTF-8 statt filename=, damit Umlaute im Dateinamen überleben.
            'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(track.originalName)}`,
        });

        return new StreamableFile(stream);
    }

    /** Löscht einen eigenen Track samt Audiodatei. Unwiderruflich. */
    @ApiResponse({ status: 204, description: 'Track gelöscht, kein Inhalt.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 404, description: 'Kein eigener Track mit dieser ID.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteTrack(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<void> {
        return await this.trackservice.remove(id, req.user.sub);
    }

    /** Benennt einen eigenen Track um und gibt ihn im neuen Zustand zurück. */
    @ApiResponse({ status: 200, description: 'Trackname geändert.', type: TrackResponseDto })
    @ApiResponse({ status: 400, description: 'Name fehlt, ist leer oder zu lang.' })
    @ApiResponse({ status: 401, description: 'Token fehlt, ist ungültig oder abgelaufen.' })
    @ApiResponse({ status: 404, description: 'Kein eigener Track mit dieser ID.' })
    @Patch(':id')
    async renameTrack(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RenameTrackDto, //body und nicht als Parameter, da Schrägstriche etc im Namen enthalten sein können
    ): Promise<TrackResponseDto> {
        const renamedTrack = await this.trackservice.rename(id, req.user.sub, dto.newTitle);
        return TrackResponseDto.from(renamedTrack);
    }


    
}
