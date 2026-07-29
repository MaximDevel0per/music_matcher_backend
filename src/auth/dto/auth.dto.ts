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
