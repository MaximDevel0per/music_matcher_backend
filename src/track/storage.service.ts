import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Readable } from 'stream';

/**
 * Kapselt den Objektspeicher (Cloudflare R2, S3-kompatibel).
 *
 * Der Rest der App kennt nur Schlüssel (`storedName`) und Bytes. Ein Wechsel
 * auf einen anderen Anbieter oder zurück auf das lokale Dateisystem betrifft
 * nur diese Klasse.
 */
@Injectable()
export class StorageService {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(config: ConfigService) {
        // getOrThrow statt get: fehlt eine Variable, scheitert der Start —
        // besser als ein Server, der erst beim ersten Upload umfällt.
        this.bucket = config.getOrThrow<string>('R2_BUCKET');
        this.client = new S3Client({
            region: 'auto', // R2 kennt keine Regionen, das SDK verlangt das Feld trotzdem
            endpoint: config.getOrThrow<string>('R2_ENDPOINT'),
            credentials: {
                accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
                secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
            },
        });
    }

    /**
     * Erzeugt den Schlüssel, unter dem das Objekt abgelegt wird.
     * Der Originalname wird bewusst nicht verwendet: er ist weder eindeutig
     * noch vertrauenswürdig. Nur die Endung wird übernommen, damit man beim
     * Blick ins Bucket noch erkennt, worum es sich handelt.
     */
    createKey(originalName: string): string {
        const ext = extname(originalName).toLowerCase();
        const safeExt = /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : '';
        return `${randomUUID()}${safeExt}`;
    }

    async put(key: string, body: Buffer, contentType: string): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            }),
        );
    }

    /** Liefert einen Stream — die Datei wird nicht komplett in den Speicher geladen. */
    async getStream(key: string): Promise<Readable> {
        try {
            const res = await this.client.send(
                new GetObjectCommand({ Bucket: this.bucket, Key: key }),
            );
            return res.Body as Readable;
        } catch (err) {
            // Objekt weg, DB-Zeile noch da: kann bei manuellem Eingriff ins Bucket passieren.
            if ((err as { name?: string }).name === 'NoSuchKey') {
                throw new NotFoundException('Die Audiodatei ist nicht mehr vorhanden');
            }
            throw err;
        }
    }

    /** S3 ist hier idempotent: ein nicht vorhandener Schlüssel ist kein Fehler. */
    async delete(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
}
