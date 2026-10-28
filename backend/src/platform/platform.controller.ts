import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { drawCertificate } from './certificate-design';
import { Actor } from '../auth/access.service';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { PlatformService } from './platform.service';
import { ExamService } from './exam.service';
import { MomoService } from './momo.service';
import { RecommendationService } from './recommendation.service';
import { LearningPathService } from './learning-path.service';
type AuthRequest = { user: Actor };
@Controller('api/platform')
export class PlatformController {
  constructor(
    private readonly service: PlatformService,
    private readonly exams: ExamService,
    private readonly momo: MomoService,
    private readonly recommendations: RecommendationService,
    private readonly paths: LearningPathService,
  ) {}
  @Get('courses/:id/study-state') @Roles('STUDENT') studyState(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.studyState(r.user, id);
  }
  @Get('courses/:id/classroom') classroom(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.classroom(r.user, id);
  }
  @Get('courses/:id/content') @Roles('ADMIN', 'TEACHER') content(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.courseContent(r.user, id);
  }
  @Post('courses/:id/sections') @Roles('ADMIN', 'TEACHER') section(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { title: string },
  ) {
    return this.service.section(r.user, id, b.title);
  }
  @Patch('courses/:id/lesson-order') @Roles('ADMIN', 'TEACHER') reorder(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { lessonIds: number[] },
  ) {
    return this.service.reorder(r.user, id, b.lessonIds);
  }
  @Patch('lessons/:id') @Roles('ADMIN', 'TEACHER') editLesson(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.service.editLesson(r.user, id, b);
  }
  @Delete('lessons/:id') @Roles('ADMIN', 'TEACHER') archiveLesson(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.archiveLesson(r.user, id);
  }
  @Post('lessons/:id/resources')
  @Roles('ADMIN', 'TEACHER')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024, files: 1 },
    }),
  )
  resource(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    return this.service.addResource(r.user, id, b, file);
  }
  @Get('media/:id') async media(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.service.media(r.user, id);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(file.path);
  }
  @Get('assignments') @Roles('ADMIN') assignments(@Req() r: AuthRequest) {
    return this.service.assignments(r.user);
  }
  @Get('notifications') notifications(@Req() r: AuthRequest) {
    return this.service.notifications(r.user);
  }
  @Patch('notifications/:id/read') readNotification(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.readNotification(r.user, id);
  }
  @Get('moderation') @Roles('ADMIN') moderation(@Req() r: AuthRequest) {
    return this.service.moderation(r.user);
  }
  @Post('moderation/:id') @Roles('ADMIN') review(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { decision: string; note: string },
  ) {
    return this.service.review(r.user, id, b);
  }
  @Post('courses/:id/teachers/:teacherId') @Roles('ADMIN') assign(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
  ) {
    return this.service.assignment(r.user, id, teacherId);
  }
  @Delete('courses/:id/teachers/:teacherId') @Roles('ADMIN') unassign(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
  ) {
    return this.service.assignment(r.user, id, teacherId, true);
  }
  @Get('courses/:id/questions') questions(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.questions(r.user, id);
  }
  @Post('courses/:id/questions') ask(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { subject: string; body: string },
  ) {
    return this.service.ask(r.user, id, b.subject, b.body);
  }
  @Post('questions/:id/messages') reply(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { body: string },
  ) {
    return this.service.reply(r.user, id, b.body);
  }
  @Get('tickets/:id') ticket(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.ticket(r.user, id);
  }
  @Get('tickets') tickets(@Req() r: AuthRequest) {
    return this.service.tickets(r.user);
  }
  @Patch('tickets/:id') updateTicket(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.service.updateTicket(r.user, id, b);
  }
  @Post('courses/:id/certificate') @Roles('STUDENT') certificateIssue(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.issueCertificate(r.user, id);
  }
  @Public() @Get('certificates/:code/verify') async verify(
    @Param('code') code: string,
  ) {
    const c = await this.service.certificate(code);
    return {
      code: c.certificate_code,
      learner: c.full_name,
      course: c.course_name,
      status: c.status,
      issuedAt: c.issued_at,
    };
  }
  @Get('certificates/:code/pdf') async pdf(
    @Req() r: AuthRequest,
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const c = await this.service.certificate(code, r.user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="VEDU-${c.certificate_code.replace(/[^A-Za-z0-9-]/g, '')}.pdf"`,
    );
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 60,
    });
    doc.pipe(res);
    drawCertificate(doc, c);
    doc.end();
  }
  @Get('reports') @Roles('ADMIN', 'TEACHER') async report(
    @Req() r: AuthRequest,
    @Query() q: any,
    @Res() res: Response,
  ) {
    const rows: any[] = await this.service.report(r.user, q);
    if (q.format !== 'csv') return res.json(rows);
    const headers = [
      'enrollment_id',
      'course_name',
      'full_name',
      'username',
      'enrolled_at',
      'status',
      'payment_status',
      'final_price',
      'completed_lessons',
      'actual_seconds',
      'best_score',
    ];
    const escape = (value: unknown) => {
      let text =
        value instanceof Date
          ? value.toISOString()
          : value !== null && typeof value === 'object'
            ? JSON.stringify(value)
            : typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean' ||
                typeof value === 'bigint'
              ? String(value)
              : '';
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="vedu-report.csv"',
    );
    res.send(
      '\uFEFF' +
        headers.join(',') +
        '\r\n' +
        rows
          .map((row) => headers.map((h) => escape(row[h])).join(','))
          .join('\r\n'),
    );
  }
  @Post('courses/:id/quizzes') @Roles('ADMIN', 'TEACHER') createQuiz(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.service.createQuiz(r.user, id, b);
  }
  @Patch('attempts/:id/draft') @Roles('STUDENT') draft(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { answers: unknown },
  ) {
    return this.exams.draft(id, r.user, b.answers);
  }
  @Post('watch/:id') @Roles('STUDENT') watch(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.openWatch(r.user, id);
  }
  @Post('watch/heartbeat/sync') @Roles('STUDENT') heartbeat(
    @Req() r: AuthRequest,
    @Body() b: any,
  ) {
    return this.service.heartbeat(r.user, b);
  }
  @Get('checkout/:id') @Roles('STUDENT') checkoutStatus(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.momo.status(r.user, id);
  }
  @Post('checkout/:id') @Roles('STUDENT') checkout(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.momo.checkout(r.user, id);
  }
  @Public() @Post('payments/momo/ipn') @HttpCode(204) async ipn(
    @Body() b: any,
  ) {
    await this.momo.ipn(b);
  }
  @Post('ml/train') @Roles('ADMIN') train(
    @Req() r: AuthRequest,
    @Body() b: any,
  ) {
    return this.recommendations.train(r.user, b);
  }
  @Get('ml/experiments') @Roles('ADMIN') experiments(@Req() r: AuthRequest) {
    return this.recommendations.experiments(r.user);
  }
  @Get('ml/jobs/:id') @Roles('ADMIN') job(
    @Req() r: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.recommendations.job(r.user, id);
  }
  @Post('ml/jobs/:id/replay') @Roles('ADMIN') replay(
    @Req() r: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.recommendations.replay(r.user, id);
  }
  @Post('ml/mappings') @Roles('ADMIN') mapping(
    @Req() r: AuthRequest,
    @Body() b: any,
  ) {
    return this.recommendations.mapping(r.user, b);
  }
  @Post('courses/:id/recommendations') @Roles('STUDENT') recommend(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recommendations.recommend(r.user, id);
  }
  @Post('courses/:id/path-options') @Roles('STUDENT') pathOptions(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: unknown,
  ) {
    return this.paths.generate(r.user, id, b);
  }
  @Get('courses/:id/path-options') @Roles('STUDENT') pathHistory(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paths.list(r.user, id);
  }
  @Get('path-options/:id') @Roles('STUDENT') pathSet(
    @Req() r: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.paths.get(r.user, id);
  }
  @Patch('path-options/:id/selection') @Roles('STUDENT') selectPath(
    @Req() r: AuthRequest,
    @Param('id') id: string,
    @Body() b: { planId: string },
  ) {
    return this.paths.select(r.user, id, b.planId);
  }
  @Post('path-options/:id/feedback') @Roles('STUDENT') pathFeedback(
    @Req() r: AuthRequest,
    @Param('id') id: string,
    @Body() b: any,
  ) {
    return this.paths.feedback(r.user, id, b);
  }
  @Post('path-options/:id/explain') @Roles('STUDENT') explainPath(
    @Req() r: AuthRequest,
    @Param('id') id: string,
    @Body() b: { consent: boolean },
  ) {
    return this.paths.explain(r.user, id, b.consent);
  }
  @Patch('lessons/:id/pedagogy') @Roles('TEACHER', 'ADMIN') pedagogy(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.paths.pedagogy(r.user, id, b);
  }
}
