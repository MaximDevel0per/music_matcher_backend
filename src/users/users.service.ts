import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    /** Legt einen User an. Das Passwort muss bereits gehasht sein. */
    async createUser(email: string, hashedPassword: string): Promise<User> {
        const newUser = this.userRepository.create({ email, password: hashedPassword });
        return await this.userRepository.save(newUser);
    }

    async findOne(email: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return await this.userRepository.findOne({ where: { id } });
    }

    /**
     * Lädt den User inklusive Passwort-Hash — nur für Login und Passwortwechsel.
     * Überall sonst `findOne`/`findById` benutzen, damit der Hash nicht nach außen gelangt.
     */
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email },
            select: { id: true, email: true, password: true },
        });
    }

    /** Wie findByEmailWithPassword, aber über die ID aus dem JWT — unabhängig von Email-Änderungen. */
    async findByIdWithPassword(id: number): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { id },
            select: { id: true, email: true, password: true },
        });
    }

    async existsByEmail(email: string): Promise<boolean> {
        return await this.userRepository.existsBy({ email });
    }

    /** Öffentliches Profil — was andere Nutzer sehen dürfen. */
    async findPublicProfile(id: number): Promise<Pick<User, 'id' | 'email'> | null> {
        return await this.userRepository.findOne({
            where: { id },
            select: { id: true, email: true },
        });
    }

    async getAllUser(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async updateEmail(id: number, email: string): Promise<User> {
        // Kollision vorher abfangen, sonst schlägt die unique-Constraint als 500 durch.
        const taken = await this.userRepository.existsBy({ email, id: Not(id) });
        if (taken) {
            throw new ConflictException('E-Mail ist bereits vergeben');
        }
        await this.userRepository.update(id, { email });
        return (await this.findById(id))!;
    }

    async updatePassword(id: number, hashedPassword: string): Promise<void> {
        await this.userRepository.update(id, { password: hashedPassword });
    }

    async deleteById(id: number): Promise<boolean> {
        const res = await this.userRepository.delete(id);
        return !!res.affected;
    }
}
