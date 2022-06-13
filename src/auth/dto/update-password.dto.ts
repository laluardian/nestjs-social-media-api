import { IsNotEmpty, IsString } from 'class-validator'

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @IsString()
  @IsNotEmpty()
  newPassword: string
}
