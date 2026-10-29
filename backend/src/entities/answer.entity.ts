import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'answers',
})
export class Answer {
    @PrimaryGeneratedColumn({ name: 'answer_id' })
    answerId: number;

    @Column({ name: 'question_id' })
    questionId: number;

    @Column({ name: 'answer_text', type: 'text' })
    answerText: string;

    @Column({ name: 'is_correct' })
    isCorrect: boolean;

    @Column({ name: 'answer_order' })
    answerOrder: number;
}