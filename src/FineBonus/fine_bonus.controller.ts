import { Body, Controller, HttpCode, Post, Req, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { PaginationI } from 'src/main';
import { FineBonusType } from './Entity/fine_bonus_type';
import { FineBonusService } from './fine_bonus.service';
import {
  CreateFineBonusDto,
  CreateUserFineBonusDto,
  ListFineBonusDto,
  ListUserFineBonusDto,
  UpdateFineBonusDto,
  UpdateUserFineBonusDto,
} from './Dto/fine_bonus.dto';

@Controller('fine-bonus')
export class FineBonusController {
  constructor(private readonly fineBonusService: FineBonusService) {}

  @Post('list-fine-bonus')
  @HttpCode(200)
  async listFineBonus(@Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListFineBonusDto): Promise<{
    list_fine_bonus: { id: number, name: string, type: FineBonusType, created_at: string, updated_at: string }[],
    pagination: PaginationI,
  }> {
    return await this.fineBonusService.listFineBonus(data);
  }

  @Post('list-all-fine-bonus')
  @HttpCode(200)
  async listAllFineBonus(): Promise<{ id: number, name: string, type: FineBonusType }[]> {
    return await this.fineBonusService.listAllFineBonus();
  }

  @Post('create-fine-bonus')
  @HttpCode(200)
  async createFineBonus(@Body(new ValidationPipe({ whitelist: true })) data: CreateFineBonusDto): Promise<{ id: number }> {
    return await this.fineBonusService.createFineBonus(data);
  }

  @Post('update-fine-bonus')
  @HttpCode(200)
  async updateFineBonus(@Body(new ValidationPipe({ whitelist: true })) data: UpdateFineBonusDto): Promise<{ is_ok: boolean }> {
    return await this.fineBonusService.updateFineBonus(data);
  }

  @Post('list-user-fine-bonus')
  @HttpCode(200)
  async listUserFineBonus(@Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListUserFineBonusDto) {
    return await this.fineBonusService.listUserFineBonus(data);
  }

  @Post('create-user-fine-bonus')
  @HttpCode(200)
  async createUserFineBonus(
    @Req() request: Request,
    @Body(new ValidationPipe({ whitelist: true })) data: CreateUserFineBonusDto,
  ): Promise<{ id: number }> {
    return await this.fineBonusService.createUserFineBonus(data, request.body);
  }

  @Post('update-user-fine-bonus')
  @HttpCode(200)
  async updateUserFineBonus(
    @Req() request: Request,
    @Body(new ValidationPipe({ whitelist: true })) data: UpdateUserFineBonusDto,
  ): Promise<{ is_ok: boolean }> {
    return await this.fineBonusService.updateUserFineBonus(data, request.body);
  }
}
