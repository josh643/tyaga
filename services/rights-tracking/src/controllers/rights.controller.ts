import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RightsService } from '../services/rights.service';
import { CreateWorkDto } from '../dto/create-work.dto';

@Controller('works')
export class RightsController {
  constructor(private readonly rightsService: RightsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('audioFile'))
  create(@Body() createWorkDto: CreateWorkDto, @UploadedFile() file: Express.Multer.File) {
    return this.rightsService.createWork(createWorkDto, file);
  }

  @Get()
  findAll() {
    return this.rightsService.findAll();
  }
}
