import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime'
import * as bcrypt from 'bcrypt'
import { DatabaseService } from 'src/database/database.service'
import { SignInDto, SignUpDto } from './dto'
import { UpdatePasswordDto } from './dto/update-password.dto'

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: SignUpDto) {
    const { username, email, password } = dto
    try {
      const hash = await bcrypt.hash(password, 10)
      const user = await this.db.user.create({
        data: { username, email, hash },
      })
      return this.signToken(user.id, user.email)
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const errorCause = error.meta.target[0] as string
        throw new ConflictException(
          `${
            errorCause.charAt(0).toUpperCase() + errorCause.slice(1)
          } is already in use`,
        )
      }
      throw new InternalServerErrorException('Something went wrong')
    }
  }

  async signIn(dto: SignInDto) {
    const { email, password } = dto
    try {
      const user = await this.db.user.findUnique({ where: { email } })
      const validPassword = await bcrypt.compare(password, user.hash)
      if (!validPassword) throw new Error()
      return this.signToken(user.id, user.email)
    } catch (error) {
      if (error instanceof PrismaClientInitializationError) {
        throw new InternalServerErrorException('Something went wrong')
      }
      throw new NotFoundException('Email or password is incorrect')
    }
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { hash: true },
      })

      const validPassword = await bcrypt.compare(dto.currentPassword, user.hash)
      if (!validPassword) {
        throw new NotAcceptableException('Current password is incorrect')
      }

      const hash = await bcrypt.hash(dto.newPassword, 10)
      await this.db.user.update({
        where: { id: userId },
        data: { hash },
      })

      return {
        statusCode: 200,
        message: 'Password successfully updated',
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong')
    }
  }

  private async signToken(userId: string, email: string) {
    const payload = { sub: userId, email }
    const secret = this.config.get('JWT_SECRET')
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '24h',
      secret,
    })
    return { access_token: token }
  }
}
