import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpCode } from '@nestjs/common';
import { PaginationI } from 'src/main';
import { CreateWorkShiftDTO, SuggestShiftUserDto, WorkShiftDTO, UpdateWorkShiftDTO } from './Dto/work_shift.dto';
import { WorkShiftStatus } from './Entity/work_shift.ts.entity';
import { WorkShiftService } from './work_shift.service';

@Controller('work-shift')
export class WorkShiftController {
  constructor(
    private readonly workShiftService: WorkShiftService,

  ) {}

  /**
   * Получить смены(с фильтром и пагинацией)
   */
  @Post('list-work-shift')
  @HttpCode(200)
  async listWorkShift(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: WorkShiftDTO,): Promise<{
    list_work_shift: {
      shift_id: number,
      call_date_start: string,
      call_date_end: string,
      user_id: number,
      master_user_id: number,
      status: WorkShiftStatus,
      event_id: number,
      event_name: string,
      comment: string,
      list_user_id: number[],
    }[],
    pagination: PaginationI,
  }> {

    return await this.workShiftService.listWorkShift(data, request.body);
  }

  /**
   * Подсказки сотрудников по началу фамилии, имени или псевдонима
   */
  @Post('suggest-shift-users')
  @HttpCode(200)
  async suggestShiftUsers(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: SuggestShiftUserDto,): Promise<{
    id: number,
    label: string,
  }[]> {

    return await this.workShiftService.suggestShiftUsers(data, request.body);
  }

  /**
  * Создать смену
  */
  @Post('create-work-shift')
  @HttpCode(200)
  async createWorkShift(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: CreateWorkShiftDTO,): Promise<string> {

    return await this.workShiftService.createWorkShift(data, request.body);
  }

  /**
  * Обновить смену
  */
  @Post('update-work-shift')
  @HttpCode(200)
  async updateWorkShift(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  ) data: UpdateWorkShiftDTO,): Promise<{ is_ok: boolean, message: string }> {

    return await this.workShiftService.updateWorkShift(data, request.body);
  }


}
