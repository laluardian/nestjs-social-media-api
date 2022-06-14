import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { profileSelect } from 'src/user/user.service'
import { CreatePostDto } from './dto'

@Injectable()
export class PostService {
  constructor(private db: DatabaseService) {}

  async getPost(postId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: {
        likedBy: { select: profileSelect },
      },
    })

    return post
  }

  async getFeedPosts(userId: string) {
    const following = await this.db.user.findUnique({
      where: { id: userId },
      select: { following: { select: { id: true } } },
    })

    const posts = await this.db.post.findMany({
      where: {
        authorId: {
          in: [...following.following.map(user => user.id), userId],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return posts
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.db.post.create({
      data: { authorId: userId, ...dto },
    })

    return post
  }

  async likeOrUnlikePost(userId: string, postId: string) {
    const [post, user] = await this.db.$transaction([
      this.db.post.findUnique({ where: { id: postId } }),
      this.db.user.findUnique({
        where: { id: userId },
        include: { likes: true },
      }),
    ])

    if (!post) {
      throw new NotFoundException(
        'The post you are trying to like does not exist',
      )
    }

    if (user.likes.some(post => post.id === postId)) {
      await this.db.user.update({
        where: { id: userId },
        data: {
          likes: {
            disconnect: { id: post.id },
          },
        },
      })

      return {
        statusCode: 200,
        message: `${user.username} unliked a post with id ${post.id}`,
      }
    }

    await this.db.user.update({
      where: { id: userId },
      data: {
        likes: {
          connect: { id: post.id },
        },
      },
    })

    return {
      status: 200,
      message: `${user.username} liked a post with id ${post.id}`,
    }
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new NotFoundException(
        'The post you are trying to delete does not exist',
      )
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post')
    }

    await this.db.post.delete({ where: { id: postId } })

    return {
      statusCode: 200,
      message: `Post with id ${post.id} successfully deleted`,
    }
  }
}
