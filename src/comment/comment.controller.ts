import { Controller, Delete, Post, UseGuards } from '@nestjs/common'
import { JwtGuard } from 'src/auth/guards'
import { GetUser } from 'src/user/decorators'
import { CommentService } from './comment.service'
import { CreateCommentDto } from './dto'

@UseGuards(JwtGuard)
@Controller('comments')
export class CommentController {
  constructor(private comment: CommentService) {}

  @Post()
  createComment(
    @GetUser('id') userId: string,
    postId: string,
    dto: CreateCommentDto,
  ) {
    return this.comment.createComment(userId, postId, dto)
  }

  @Delete(':commentId')
  deleteComment(@GetUser('id') userId: string, commentId: string) {
    return this.comment.deleteComment(userId, commentId)
  }
}
