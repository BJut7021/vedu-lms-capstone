import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CoursesService } from './courses.service';
import { Public } from '../auth/public.decorator';

@Controller('api/courses')
@Public()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('topic') topic?: string,
    @Query('sort') sort?: string,
  ) {
    return this.coursesService.findAll({ q, topic, sort });
  }

  @Get('suggestions')
  suggestions(@Query('q') q?: string) {
    return this.coursesService.suggestions(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id, false);
  }
  @Get(':id/syllabus')
  async syllabus(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const path = await this.coursesService.syllabus(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="VEDU-syllabus-${id}.pdf"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path);
  }
}
