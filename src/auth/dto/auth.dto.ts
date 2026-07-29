import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({ example: 'max@example.com', maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @ApiProperty({ example: 'geheim12345', minLength: 8, maxLength: 72 })
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;
}

export class SignInDto {
    @ApiProperty({ example: 'max@example.com', maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @ApiProperty({ example: 'geheim12345', minLength: 8, maxLength: 72 })
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;
}

/** Löschen des eigenen Accounts — Passwort dient als Bestätigung. */
export class DeleteAccountDto {
  @ApiProperty({ example: 'geheim12345' })
  @IsString()
  password!: string;
}

/** Die Identität kommt aus dem JWT, nicht aus dem Body — deshalb kein email-Feld. */
export class ChangePasswordDto {
  @ApiProperty({ example: 'geheim12345' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'neuesGeheim123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

