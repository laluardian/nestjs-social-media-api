import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import { ParsedUrlQuery } from 'querystring'
import { DatabaseService } from 'src/database/database.service'
import { UpdateUserDto } from './dto'

const profileSelect = {
  id: true,
  username: true,
  image: true,
  bio: true,
}

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async getUser(username: string, { get }: ParsedUrlQuery) {
    const user = await this.db.user.findUnique({
      where: { username },
      include: {
        followers: { select: profileSelect },
        following: { select: profileSelect },
        posts: {},
      },
    })

    if (!user) {
      throw new NotFoundException('The user you are looking for does not exist')
    }

    if (get === 'followers' || get === 'following') {
      return user[get as string].map(({ id, username, image, bio }: User) => {
        return { id, username, image, bio }
      })
    }

    delete user.hash
    return user
  }

  async getMultipleUsers({ search }: ParsedUrlQuery) {
    const users = await this.db.user.findMany({
      where: search ? { username: { contains: search as string } } : {},
      select: profileSelect,
    })

    if (search && users.length === 0) {
      throw new NotFoundException(
        `Cannot find any users whose username contains '${search}'`,
      )
    }

    return users
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: { ...dto },
    })

    delete user.hash
    return user
  }

  async deleteUser(userId: string) {
    const [, { username }] = await this.db.$transaction([
      // delete posts associated with the user
      // comments associated with the posts are also deleted cascadely
      this.db.post.deleteMany({ where: { authorId: userId } }),
      // actually delete the user
      // comments associated with the user are also deleted cascadely
      this.db.user.delete({ where: { id: userId } }),
    ])

    return {
      statusCode: 200,
      message: `User with username ${username} successfully deleted`,
    }
  }

  async followOrUnfollowUser(userId: string, targetUsername: string) {
    const [target, user] = await this.db.$transaction([
      this.db.user.findUnique({ where: { username: targetUsername } }),
      this.db.user.findUnique({
        where: { id: userId },
        include: {
          following: { select: profileSelect },
        },
      }),
    ])

    if (!target) {
      throw new NotFoundException(
        'The user you are trying to follow does not exist',
      )
    }

    // if the user already being followed
    // unfollow the user
    if (user.following.some(f => f.username === targetUsername)) {
      await this.db.user.update({
        where: { id: userId },
        data: {
          following: {
            disconnect: { id: target.id },
          },
        },
      })

      return {
        statusCode: 200,
        message: `${user.username} unfollowed ${targetUsername}`,
      }
    }

    // otherwise, follow the user
    await this.db.user.update({
      where: { id: userId },
      data: {
        following: {
          connect: { id: target.id },
        },
      },
    })

    return {
      status: 200,
      message: `${user.username} followed ${target.username}`,
    }
  }
}
