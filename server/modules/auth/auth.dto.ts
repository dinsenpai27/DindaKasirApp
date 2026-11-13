import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@kasirku.id', description: 'Email user terdaftar' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: 'PIN / Password login kasir' })
  @IsString()
  @IsNotEmpty()
  pin!: string;
}
