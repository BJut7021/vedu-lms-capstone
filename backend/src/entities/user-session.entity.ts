import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'auth',
    name: 'user_sessions',
})
export class UserSession {
    @PrimaryColumn({
        name: 'session_id',
        type: 'uuid',
    })
    sessionId: string;

    @Column({
        name: 'user_id',
        type: 'bigint',
    })
    userId: number;

    @Column({
        name: 'refresh_token_hash',
        type: 'varchar',
        length: 255,
    })
    refreshTokenHash: string;

    @Column({
        name: 'device_info',
        type: 'text',
        nullable: true,
    })
    deviceInfo: string | null;

    @Column({
        name: 'ip_address',
        type: 'inet',
        nullable: true,
    })
    ipAddress: string | null;

    @Column({
        name: 'user_agent',
        type: 'text',
        nullable: true,
    })
    userAgent: string | null;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
    })
    expiresAt: Date;

    @Column({
        name: 'revoked_at',
        type: 'timestamptz',
        nullable: true,
    })
    revokedAt: Date | null;

    @Column({
        name: 'last_used_at',
        type: 'timestamptz',
        nullable: true,
    })
    lastUsedAt: Date | null;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}