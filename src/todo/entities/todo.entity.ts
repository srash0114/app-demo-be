import { User } from 'src/user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Todo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string; 

    @Column({ nullable: true })
    description: string;

    @Column()
    isDone: boolean;

    @Column()
    UserId: number;

    @ManyToOne(() => User, (user) => user.todos)
    @JoinColumn({ name: 'UserId' })
    user: User;
}
