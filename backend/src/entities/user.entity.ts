import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

@Entity({
    schema: 'auth',
    name: 'users',
})
export class User {
    @PrimaryGeneratedColumn({
        name: 'user_id',
        type: 'bigint',
    })
    userId: number;

    @Column({
        name: 'full_name',
        length: 120,
    })
    fullName: string;

    @Column({
        length: 180,
    })
    email: string;

    @Column({
        name: 'password_hash',
        length: 255,
    })
    passwordHash: string;

    @Column({
        length: 20,
        default: 'STUDENT',
    })
    role: UserRole;

    @Column({
        name: 'avatar_url',
        type: 'text',
        nullable: true,
    })
    avatarUrl: string | null;

    @Column({
        name: 'is_active',
        default: true,
    })
    isActive: boolean;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamptz',
    })
    updatedAt: Date;
}