import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from 'src/database/database.service'
import { CreateCommentDto } from './dto'

@Injectable()
export class CommentService {
  constructor(private db: DatabaseService) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    try {
      const comment = await this.db.comment.create({
        data: { authorId: userId, postId, ...dto },
      })
      return comment
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong')
    }
  }

  async deleteComment(userId: string, commentId: string) {
    try {
      const [user, comment] = await this.db.$transaction([
        this.db.user.findUnique({ where: { id: userId } }),
        this.db.comment.findUnique({ where: { id: commentId } }),
      ])

      if (!comment) {
        throw new NotFoundException(
          'The comment you are trying to delete does not exist',
        )
      }

      if (comment.authorId !== user.id) {
        throw new UnauthorizedException(
          'You are not authorized to delete this comment',
        )
      }

      return {
        statusCode: 200,
        message: `A comment with id ${comment.id} successfully deleted`,
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong')
    }
  }
}
