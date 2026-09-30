import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'questions',
})
export class Question {
    @PrimaryGeneratedColumn({ name: 'question_id' })
    questionId: number;

    @Column({ name: 'quiz_id' })
    quizId: number;

    @Column({ name: 'question_text', type: 'text' })
    questionText: string;

    @Column({ name: 'question_type', length: 50 })
    questionType: string;

    @Column({ name: 'question_order' })
    questionOrder: number;

    @Column({
        type: 'numeric',
        precision: 5,
        scale: 2,
    })
    points: number;
}