import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
    schema: 'lms',
    name: 'lesson_resources',
})
export class LessonResource {
    @PrimaryGeneratedColumn({
        name: 'resource_id',
        type: 'bigint',
    })
    resourceId: number;

    @Column({
        name: 'lesson_id',
        type: 'bigint',
    })
    lessonId: number;

    @Column({
        name: 'resource_type',
        type: 'varchar',
        length: 20,
    })
    resourceType: string;

    @Column({
        name: 'title',
        type: 'varchar',
        length: 220,
        nullable: true,
    })
    title: string | null;

    @Column({
        name: 'resource_url',
        type: 'text',
    })
    resourceUrl: string;

    @Column({
        name: 'display_order',
        type: 'integer',
        default: 1,
    })
    displayOrder: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}