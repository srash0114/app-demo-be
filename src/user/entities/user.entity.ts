import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Todo } from 'src/todo/entities/todo.entity';
import  { Order } from '../../orders/entities/order.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    @OneToMany(() => Todo, (todo) => todo.UserId)
    todos: Todo[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];
}
