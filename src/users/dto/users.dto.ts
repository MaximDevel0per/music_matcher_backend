import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

/** Payload für PATCH /users/me — die Identität kommt aus dem JWT. */
export class UpdateEmailDto {
  @ApiProperty({ example: 'neue-adresse@example.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
