import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    InjectRepository,
} from '@nestjs/typeorm';

import {
    Repository,
    DataSource,
} from 'typeorm';

import { Enrollment } from '../entities/enrollment.entity';

@Injectable()
export class EnrollmentService {
    constructor(
        @InjectRepository(Enrollment)
        private readonly enrollmentRepository: Repository<Enrollment>,
        private readonly db:DataSource,
    ) { }

    async findAll() {
        return this.enrollmentRepository.find({
            order: {
                enrollmentId: 'ASC',
            },
        });
    }

    async findOne(enrollmentId: number) {
        const enrollment =
            await this.enrollmentRepository.findOne({
                where: {
                    enrollmentId,
                },
            });

        if (!enrollment) {
            throw new NotFoundException(
                'Enrollment not found',
            );
        }

        return enrollment;
    }

    async findByStudent(studentId: number) {
        return this.enrollmentRepository.find({
            where: {
                studentId,
            },
            order: {
                enrolledAt: 'DESC',
            },
        });
    }

    async findByCourse(courseId: number) {
        return this.enrollmentRepository.find({
            where: {
                courseId,
            },
            order: {
                enrolledAt: 'DESC',
            },
        });
    }

    async create(data: {
        studentId: number;
        courseId: number;
        status?: string;
    }) {
        const existing =
            await this.enrollmentRepository.findOne({
                where: {
                    studentId: data.studentId,
                    courseId: data.courseId,
                },
            });

        if (existing) {
            throw new ConflictException(
                'Student is already enrolled in this course',
            );
        }

        const enrollment =
            this.enrollmentRepository.create({
                studentId: data.studentId,
                courseId: data.courseId,
                status: data.status ?? 'ACTIVE',
            });

        return this.enrollmentRepository.save(
            enrollment,
        );
    }

    async enrollOrGet(studentId: number, courseId: number) {
        const [course]=await this.db.query("SELECT price FROM lms.courses WHERE course_id=$1 AND status='PUBLISHED' AND NOT is_deleted",[courseId]);
        if(!course) throw new NotFoundException('Khóa học chưa công bố');
        const [actor]=await this.db.query('SELECT username FROM auth.users WHERE user_id=$1',[studentId]);
        if(actor?.username.startsWith('guest_')) {
          if(Number(course.price)>0)throw new ConflictException('Khách không ghi danh khóa có phí. Vui lòng đăng ký tài khoản');
          return this.db.transaction(async m=>{
            await m.query('SELECT user_id FROM auth.users WHERE user_id=$1 FOR UPDATE',[studentId]);
            const [existing]=await m.query('SELECT * FROM enrollment.enrollments WHERE student_id=$1 AND course_id=$2',[studentId,courseId]);
            if(existing)return existing;
            const [count]=await m.query('SELECT count(*)::int n FROM enrollment.enrollments WHERE student_id=$1',[studentId]);
            if(count.n>=2)throw new ConflictException('Khách được học thử tối đa 2 khóa miễn phí. Đăng ký tài khoản để tiếp tục');
            const [id]=await m.query('SELECT enrollment.fn_enroll_student($1::bigint,$2::bigint) id',[studentId,courseId]);
            return (await m.query('SELECT enrollment_id AS "enrollmentId",course_id AS "courseId",status FROM enrollment.enrollments WHERE enrollment_id=$1',[id.id]))[0];
          });
        }
        const existing = await this.enrollmentRepository.findOne({
            where: { studentId, courseId },
        });

        if (existing?.status === 'ACTIVE' || existing?.status === 'COMPLETED') {
            return existing;
        }

        if (existing) {
            existing.status = 'ACTIVE';
            return this.enrollmentRepository.save(existing);
        }

        return this.enrollmentRepository.save(
            this.enrollmentRepository.create({
                studentId,
                courseId,
                status: 'ACTIVE',
            }),
        );
    }

    async update(
        enrollmentId: number,
        data: {
            status?: string;
        },
    ) {
        const enrollment =
            await this.findOne(enrollmentId);

        if (data.status !== undefined) {
            enrollment.status = data.status;
        }

        return this.enrollmentRepository.save(
            enrollment,
        );
    }

    async remove(enrollmentId: number) {
        const enrollment =
            await this.findOne(enrollmentId);

        await this.enrollmentRepository.remove(
            enrollment,
        );

        return {
            message: 'Enrollment deleted successfully',
        };
    }
}
