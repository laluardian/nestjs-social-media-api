import { Global, Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostService } from './post.service'

@Global()
@Module({
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
