import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Public } from '../auth/public.decorator';

@Controller('api/courses')
@Public()
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Get()
    findAll(@Query('q') q?: string, @Query('topic') topic?: string, @Query('sort') sort?: string) {
        return this.coursesService.findAll({ q, topic, sort });
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.coursesService.findOne(id, false);
    }
}
