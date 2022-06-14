import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtGuard } from 'src/auth/guards'
import { GetUser } from 'src/user/decorators'
import { CreatePostDto } from './dto'
import { PostService } from './post.service'

@UseGuards(JwtGuard)
@Controller('posts')
export class PostController {
  constructor(private post: PostService) {}

  @Get(':postId')
  getPost(@Param('postId') postId: string) {
    return this.post.getPost(postId)
  }

  @Get()
  getFeedPosts(@GetUser('id') userId: string) {
    return this.post.getFeedPosts(userId)
  }

  @Post()
  createPost(@GetUser('id') userId: string, @Body() dto: CreatePostDto) {
    return this.post.createPost(userId, dto)
  }

  @Post(':postId/like')
  likeOrUnlikePost(
    @GetUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.post.likeOrUnlikePost(userId, postId)
  }

  @Delete(':postId')
  deletePost(@GetUser('id') userId: string, @Param('postId') postId: string) {
    return this.post.deletePost(userId, postId)
  }
}
