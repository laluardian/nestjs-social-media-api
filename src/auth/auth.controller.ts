import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { GetUser } from 'src/user/decorators'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto } from './dto'
import { UpdatePasswordDto } from './dto/update-password.dto'
import { JwtGuard } from './guards'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() dto: SignInDto) {
    return this.auth.signIn(dto)
  }

  @UseGuards(JwtGuard)
  @Patch()
  updatePassword(
    @GetUser('id') userId: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.auth.updatePassword(userId, dto)
  }
}
