import { BadRequestException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Track } from './track.entity';
import { TrackService } from './track.service';
import { TrackController } from './track.controller';
import { StorageService } from './storage.service';

const DEFAULT_MAX_UPLOAD_MB = 60;

@Module({
    imports: [
        TypeOrmModule.forFeature([Track]),
        // registerAsync, weil das Limit aus der Config kommt — an die kommt
        // ein Dekorator nicht heran, der wird beim Laden der Klasse ausgewertet.
        MulterModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                // Kein `storage`: ohne Angabe hält Multer die Datei im
                // Arbeitsspeicher, und genau das braucht file.buffer.
                limits: {
                    fileSize:
                        Number(config.get('MAX_UPLOAD_MB') ?? DEFAULT_MAX_UPLOAD_MB) * 1024 * 1024,
                },
                fileFilter: (_req, file, cb) => {
                    if (!file.mimetype.startsWith('audio/')) {
                        cb(new BadRequestException('Nur Audiodateien sind erlaubt'), false);
                        return;
                    }
                    cb(null, true);
                },
            }),
        }),
    ],
    providers: [TrackService, StorageService],
    controllers: [TrackController],
    exports: [TrackService],
})
export class TrackModule {}
