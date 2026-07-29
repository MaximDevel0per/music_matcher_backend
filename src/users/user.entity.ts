import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  email: string;

  /** select: false — der Hash wird nur geladen, wenn eine Query ihn explizit anfordert. */
  @Column({ select: false })
  password: string;
}