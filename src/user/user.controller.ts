import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ParsedUrlQuery } from 'querystring'
import { JwtGuard } from 'src/auth/guards'
import { GetUser } from 'src/user/decorators'
import { UpdateUserDto } from './dto'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
  constructor(private user: UserService) {}

  @Get(':username')
  getUser(@Param('username') username: string, @Query() query: ParsedUrlQuery) {
    return this.user.getUser(username, query)
  }

  @Get()
  getMultipleUsers(@Query() query: ParsedUrlQuery) {
    return this.user.getMultipleUsers(query)
  }

  @UseGuards(JwtGuard)
  @Patch()
  updateUser(@GetUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.user.updateUser(userId, dto)
  }

  @UseGuards(JwtGuard)
  @Delete()
  deleteUser(@GetUser('id') userId: string) {
    return this.user.deleteUser(userId)
  }

  @UseGuards(JwtGuard)
  @Patch(':username/follow')
  followOrUnfollowUser(
    @GetUser('id') userId: string,
    @Param('username') targetUsername: string,
  ) {
    return this.user.followOrUnfollowUser(userId, targetUsername)
  }
}
