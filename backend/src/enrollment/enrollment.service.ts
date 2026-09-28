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
} from 'typeorm';

import { Enrollment } from '../entities/enrollment.entity';

@Injectable()
export class EnrollmentService {
    constructor(
        @InjectRepository(Enrollment)
        private readonly enrollmentRepository: Repository<Enrollment>,
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