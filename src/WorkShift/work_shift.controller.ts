import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpCode } from '@nestjs/common';
import { CreateWorkShiftDTO } from './Dto/work_shift.dto';
import { WorkShiftService } from './work_shift.service';

@Controller('work-shift')
export class WorkShiftController {
  constructor(
    private readonly workShiftService: WorkShiftService,

  ) {}

  /**
   * Получить смены(с фильтром и пагинацией)
   */
  // @Post('list-work-shift')
  // @HttpCode(200)
  // async register(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListTagDto,): Promise<{
  //   tag_id: number,
  //   tag_name: string,
  //   user_id: number,
  //   created_at: string,
  //   updated_at: string,
  // }[]> {

  //   return await this.tagService.listTag(data);
  // }

  /**
  * Создать смену
  */
  @Post('create-work-shift')
  @HttpCode(200)
  async createTag(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: CreateWorkShiftDTO,): Promise<string> {

    return await this.workShiftService.createWorkShift(data, request.body);
  }

  /**
  * Обновить смену
  */
  // @Post('update-work-shift')
  // @HttpCode(200)
  // async updateUserByAdmin(@Req() request: Request, @Body(
  //   new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  // ) data: UpdateTagDto,): Promise<{ is_ok: boolean, message: string }> {

  //   return await this.tagService.updateTag(data, request.body);
  // }


}
