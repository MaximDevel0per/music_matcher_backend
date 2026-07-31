import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Track } from '../track.entity';
import { Transform } from 'class-transformer';

/** Begleitfeld zum Upload. Felder aus multipart/form-data sind immer Strings. */
export class UploadTrackDto {
    @ApiPropertyOptional({
        example: 'Daft Punk — Get Lucky',
        description: 'Anzeigename. Ohne Angabe wird der Dateiname ohne Endung verwendet.',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;
}

export class RenameTrackDto {
    @ApiProperty({
        example: 'Referenz — Drums',
        description: 'Neuer Anzeigename. Pflichtfeld; umschließende Leerzeichen werden entfernt.',
        minLength: 1,
        maxLength: 200,
    })

    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))  //wenn newTitle= " ", zählt minlength=1, deshalb muss so überprüft werden
    newTitle!: string;
}

/**
 * Was der Client zu sehen bekommt. `storedName` fehlt bewusst — das ist der
 * interne Schlüssel im Bucket und geht den Client nichts an.
 */
export class TrackResponseDto {
    @ApiProperty() id: number;
    @ApiProperty() title: string;
    @ApiProperty() originalName: string;
    @ApiProperty({ example: 'audio/flac' }) mimeType: string;
    @ApiProperty({ example: 18432000 }) sizeBytes: number;
    @ApiProperty() createdAt: Date;

    static from(track: Track): TrackResponseDto {
        return {
            id: track.id,
            title: track.title,
            originalName: track.originalName,
            mimeType: track.mimeType,
            sizeBytes: track.sizeBytes,
            createdAt: track.createdAt,
        };
    }
}
