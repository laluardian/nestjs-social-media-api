import { IsNotEmpty, IsString } from 'class-validator'
import { SignInDto } from './sign-in.dto'

export class SignUpDto extends SignInDto {
  @IsString()
  @IsNotEmpty()
  username: string
}
