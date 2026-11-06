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
import { FinalEssayService } from './final-essay.service';
import { CourseAssignmentService } from './course-assignment.service';
import { MomoService } from './momo.service';
import { ManualPaymentService } from './manual-payment.service';
import { RecommendationService } from './recommendation.service';
import { LearningPathService } from './learning-path.service';
type AuthRequest = { user: Actor };
@Controller('api/platform')
export class PlatformController {
  constructor(
    private readonly service: PlatformService,
    private readonly exams: ExamService,
    private readonly finalEssays: FinalEssayService,
    private readonly momo: MomoService,
    private readonly manualPayments: ManualPaymentService,
    private readonly recommendations: RecommendationService,
    private readonly paths: LearningPathService,
    private readonly courseAssignments: CourseAssignmentService,
  ) {}
  @Get('courses/:id/assignments') @Roles('STUDENT','TEACHER','ADMIN')
  listAssignments(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number) {
    return this.courseAssignments.list(r.user, id);
  }
  @Get('my/assignments') @Roles('STUDENT')
  myAssignments(@Req() r: AuthRequest) {
    return this.courseAssignments.mine(r.user);
  }
  @Post('courses/:id/assignments') @Roles('TEACHER','ADMIN')
  createAssignment(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.courseAssignments.create(r.user, id, body);
  }
  @Patch('assignments/:id') @Roles('TEACHER','ADMIN')
  updateAssignment(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.courseAssignments.update(r.user, id, body);
  }
  @Delete('assignments/:id') @Roles('TEACHER','ADMIN')
  archiveCourseAssignment(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number) {
    return this.courseAssignments.archive(r.user, id);
  }
  @Post('assignments/:id/versions') @Roles('STUDENT')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  saveAssignment(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>, @UploadedFile() file?: { buffer: Buffer; originalname: string }) {
    return this.courseAssignments.save(r.user, id, body, file);
  }
  @Patch('assignment-versions/:id/grade') @Roles('TEACHER','ADMIN')
  gradeAssignment(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.courseAssignments.grade(r.user, id, body);
  }
  @Get('assignment-versions/:id/file') @Roles('STUDENT','TEACHER','ADMIN')
  async assignmentFile(@Req() r: AuthRequest, @Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.courseAssignments.download(r.user, id);
    res.attachment(file.name).type('application/octet-stream').set('Cache-Control','private, no-store').set('X-Content-Type-Options','nosniff').send(file.data);
  }
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
  @Patch('courses/:courseId/lessons/:lessonId/learning-status') @Roles('STUDENT')
  markLessonLearned(
    @Req() r: AuthRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.service.markLessonLearned(r.user, courseId, lessonId);
  }
  @Get('courses/:id/content') @Roles('ADMIN', 'TEACHER') content(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.courseContent(r.user, id);
  }
  @Patch('courses/:id/overview') @Roles('ADMIN', 'TEACHER') updateOverview(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.service.updateOverview(r.user, id, b);
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

  
@Patch('lessons/:id/practice')
@Roles('ADMIN', 'TEACHER')
configurePractice(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.service.configureLessonPractice(
    r.user, id, body,
  );
}

@Get('lessons/:id/practice')
@Roles('STUDENT', 'ADMIN', 'TEACHER')
getPractice(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.service.getLessonPractice(r.user, id);
}

@Post('lessons/:id/practice/submissions')
@Roles('STUDENT')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  }),
)
submitPractice(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile()
  file?: { buffer: Buffer; originalname?: string },
) {
  return this.service.submitLessonPractice(
    r.user, id, file,
  );
}

@Get('lessons/:id/practice/submissions')
@Roles('ADMIN', 'TEACHER')
practiceSubmissions(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.service.lessonPracticeSubmissions(
    r.user, id,
  );
}

@Patch('lessons/:id/practice/submissions/:submissionId')
@Roles('ADMIN', 'TEACHER')
reviewPractice(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
  @Param('submissionId', ParseIntPipe) submissionId: number,
  @Body() body: any,
) {
  return this.service.reviewLessonPractice(
    r.user, id, submissionId, body,
  );
}

@Get('lessons/:id/practice/submissions/:submissionId/file')
@Roles('STUDENT', 'ADMIN', 'TEACHER')
async practiceFile(
  @Req() r: AuthRequest,
  @Param('id', ParseIntPipe) id: number,
  @Param('submissionId', ParseIntPipe) submissionId: number,
  @Res() res: Response,
) {
  const path = await this.service.lessonPracticeFile(
    r.user, id, submissionId,
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="bai-thuc-hanh.pdf"',
  );

  return res.sendFile(path);
}

  @Get('moderation/resources/:id/file')
  @Roles('ADMIN')
  async moderationResource(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.service.moderationResource(r.user, id);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(file.path);
  }

  @Get('moderation/quizzes/:id')
  @Roles('ADMIN')
  moderationQuizDetail(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.moderationQuizDetail(r.user, id);
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
    @Body() b: { subject: string; body: string; lessonId?: number },
  ) {
    return this.service.ask(r.user, id, b.subject, b.body, b.lessonId);
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
  @Get('teacher/quizzes/:id') @Roles('ADMIN', 'TEACHER') teacherQuiz(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.teacherQuiz(r.user, id);
  }
  @Patch('teacher/quizzes/:id') @Roles('ADMIN', 'TEACHER') updateTeacherQuiz(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.service.updateTeacherQuiz(r.user, id, b);
  }
  @Delete('teacher/quizzes/:id') @Roles('ADMIN', 'TEACHER') archiveTeacherQuiz(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.archiveTeacherQuiz(r.user, id);
  }
  @Get('final-essays/quizzes/:id')
  essayPrompt(@Req() r: AuthRequest,@Param('id',ParseIntPipe) id:number){return this.finalEssays.prompt(id,r.user);}
  @Patch('final-essays/quizzes/:id') @Roles('ADMIN','TEACHER')
  essaySavePrompt(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number,@Body() b:any){return this.finalEssays.savePrompt(id,r.user,b);}
  @Post('final-essays/attempts/:id/image') @Roles('STUDENT')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}}))
  essaySubmit(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number,@UploadedFile() file?:{buffer:Buffer;mimetype:string;originalname:string}){return this.finalEssays.submitImage(id,r.user,file);}
  @Get('final-essays/attempts/:id/review') @Roles('STUDENT')
  essayReview(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number){return this.finalEssays.reviewQuiz(id,r.user);}
  @Get('final-essays/attempts/:id/result')
  essayResult(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number){return this.finalEssays.result(id,r.user);}
  @Get('final-essays/attempts/:id/image')
  async essayImage(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number,@Res() res:Response){
    const file=await this.finalEssays.image(id,r.user);
    res.setHeader('Content-Type',file.mime);
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.send(file.bytes);
  }
  @Get('final-essays/courses/:id/submissions') @Roles('ADMIN','TEACHER')
  essayList(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number){return this.finalEssays.pending(r.user,id);}
  @Post('final-essays/attempts/:id/grade') @Roles('ADMIN','TEACHER')
  essayGrade(@Req() r:AuthRequest,@Param('id',ParseIntPipe) id:number,@Body() b:any){return this.finalEssays.grade(id,r.user,b);}
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
    return this.manualPayments.status(r.user, id);
  }
  @Post('checkout/:id') @Roles('STUDENT') checkout(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return process.env.MOMO_PAYMENT_MODE === 'gateway'
      ? this.momo.checkout(r.user, id)
      : this.manualPayments.create(r.user, id, 'MOMO_WALLET');
  }
  @Get('payments/momo/wallet') @Roles('ADMIN') momoWallet(
    @Req() r: AuthRequest,
  ) {
    return this.manualPayments.walletSettings(r.user);
  }
  @Post('payments/momo/wallet')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024, files: 1 },
    }),
  )
  configureMomoWallet(
    @Req() r: AuthRequest,
    @Body() b: any,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    return this.manualPayments.configureWallet(r.user, b, file);
  }
  @Public() @Post('payments/momo/ipn') @HttpCode(204) async ipn(
    @Body() b: any,
  ) {
    await this.momo.ipn(b);
  }
  @Post('checkout/:id/manual') @Roles('STUDENT') manualCheckout(
    @Req() r: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.manualPayments.create(r.user, id, b.method);
  }
  @Post('payments/manual/:id/report') @Roles('STUDENT') reportPayment(
    @Req() r: AuthRequest,
    @Param('id') id: string,
    @Body() b: any,
  ) {
    return this.manualPayments.report(r.user, id, b.note ?? '');
  }
  @Get('payments/manual') @Roles('ADMIN') manualPaymentList(
    @Req() r: AuthRequest,
    @Query('status') status?: string,
  ) {
    return this.manualPayments.list(r.user, status);
  }
  @Post('payments/manual/:id/review') @Roles('ADMIN') reviewPayment(
    @Req() r: AuthRequest,
    @Param('id') id: string,
    @Body() b: any,
  ) {
    return this.manualPayments.review(r.user, id, b);
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
