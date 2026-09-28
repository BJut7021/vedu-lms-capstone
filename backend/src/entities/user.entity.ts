import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'auth',
    name: 'users',
})
export class User {
    @PrimaryGeneratedColumn({ name: 'user_id' })
    userId: number;

    @Column({
        name: 'full_name',
        length: 100,
    })
    fullName: string;

    @Column({
        length: 150,
        unique: true,
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
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date;
}