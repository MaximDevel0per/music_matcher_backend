import { Injectable, NotFoundException } from '@nestjs/common';
import { Track } from './track.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { basename, extname } from 'path';
import { Readable } from 'stream';
import { StorageService } from './storage.service';

@Injectable()
export class TrackService {
    constructor(
           @InjectRepository(Track)
           private trackRepository: Repository<Track>,
           private storageService: StorageService
       ){}

    /**
     * datei wird im r2 cloudflare bucket gespeichert + db eintrag wird erstellt
     */
    async create(userId: number, file: Express.Multer.File, title?: string): Promise<Track> {
        const key = this.storageService.createKey(file.originalname);
        await this.storageService.put(key,file.buffer,file.mimetype);

        const newTrack = this.trackRepository.create({
            user: { id: userId },
            title: title?.trim() || basename(file.originalname, extname(file.originalname)),
            originalName: file.originalname,
            storedName: key,
            mimeType: file.mimetype,
            sizeBytes: file.size,
        });

        try {
            return await this.trackRepository.save(newTrack);
        } catch (err) {
            // Ohne DB-Zeile zeigt nichts mehr auf die Datei — sie wäre für
            // immer unerreichbar und würde trotzdem Platz belegen.
            await this.storageService.delete(key);
            throw err;
        }
    }

    async findAllByUser(userId: number): Promise<Track[]>{
        const foundTracks = await this.trackRepository.find({
            where:{user: {id: userId}},
            order:{createdAt: 'DESC'}
        })

        return foundTracks;
    }

    /**
     * Lädt einen Track nur, wenn er dem Nutzer gehört. Der Besitzer steckt
     * direkt in der Abfrage — deshalb ist "gibt es nicht" und "gehört jemand
     * anderem" hier derselbe Fall, und beides ergibt 404 statt 403.
     */
    async findOwned(id: number, userId: number): Promise<Track> {
        const track = await this.trackRepository.findOne({
            where: { id, user: { id: userId } },
        });

        if (!track) {
            throw new NotFoundException('Track wurde nicht gefunden');
        }

        return track;
    }

    /**
     * Öffnet die Audiodaten zum Ausliefern. Die Besitzprüfung passiert in der
     * Datenbank, bevor das Bucket überhaupt angefasst wird.
     */
    async openAudio(id: number, userId: number): Promise<{ track: Track; stream: Readable }> {
        const track = await this.findOwned(id, userId);
        const stream = await this.storageService.getStream(track.storedName);

        return { track, stream };
    }

    /**
     * Löscht Zeile und Objekt — in dieser Reihenfolge.
     *
     * Spiegelbild zu create(): scheitert der zweite Schritt, bleibt ein Objekt
     * ohne Zeile zurück (unsichtbar, kostet nur Speicher). Andersherum bliebe
     * ein Track in der Bibliothek stehen, dessen Audiodaten schon weg sind.
     */
    async remove(id: number, userId: number): Promise<void> {
        const track = await this.findOwned(id, userId);

        await this.trackRepository.remove(track);
        await this.storageService.delete(track.storedName);
    }

     /**
     * Ändert Namen eines Tracks
     */
    async rename(id: number, userId: number, newname: string): Promise<Track> {
        
        const track = await this.findOwned(id, userId);
        track.title = newname;

        const renamedTrack = await this.trackRepository.save(track)
        return renamedTrack;
    }

}
