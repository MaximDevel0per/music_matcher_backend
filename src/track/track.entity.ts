import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

/**
 * Eine hochgeladene Audiodatei in der Bibliothek eines Nutzers.
 *
 * Bewusst ohne Analysewerte (LUFS, BPM, Peaks): die entstehen über die
 * Web Audio API im Browser und werden dort beim Laden neu berechnet.
 */
@Entity()
export class Track {
  @PrimaryGeneratedColumn() id: number;

  // CASCADE räumt beim Löschen des Accounts die DB-Zeilen mit weg — die
  // Dateien auf der Platte NICHT, die muss der Service selbst entfernen.
  // Index, weil jede Abfrage nach dem Besitzer filtert.
  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column() title: string;          // Anzeigename, editierbar. Default = Dateiname ohne Endung
  @Column() originalName: string;   // wie die Datei beim Nutzer hieß — nur zur Anzeige
  @Column({ unique: true }) storedName: string;  // uuid.ext auf der Platte; der Originalname darf NIE in einen Pfad geraten
  @Column() mimeType: string;       // aus dem Upload, für den Content-Type beim Ausliefern
  @Column() sizeBytes: number;      // für Anzeige und Kontingentprüfung

  @CreateDateColumn() createdAt: Date;
}
