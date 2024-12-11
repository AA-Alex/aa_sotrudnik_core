import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpCode } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto, ListTagDto, UpdateTagDto } from './Dto/tag.dto';

@Controller('tag')
export class TagController {
  constructor(
    private readonly tagService: TagService,

  ) {}

  /**
   * Получить данные пользователей (с фильтром и пагинацией)
   */
  @Post('list-tag')
  @HttpCode(200)
  async register(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListTagDto,): Promise<{
    tag_id: number,
    tag_name: string,
    user_id: number,
    created_at: string,
    updated_at: string,
  }[]> {

    return await this.tagService.listTag(data);
  }

  /**
  * Создать пользователя
  */
  @Post('create-tag')
  @HttpCode(200)
  async createTag(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: CreateTagDto,): Promise<string> {

    return await this.tagService.createTag(data);
  }

  /**
  * Обновить пользователя
  */
  @Post('update-tag')
  @HttpCode(200)
  async updateUserByAdmin(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  ) data: UpdateTagDto,): Promise<{ is_ok: boolean, message: string }> {

    return await this.tagService.updateTag(data);
  }


}
