import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  create(createTodoDto: CreateTodoDto, userId: number): Promise<Todo> {
    const todo = this.todoRepository.create({ ...createTodoDto, UserId: userId, isDone: false });
    return this.todoRepository.save(todo);
  }

  findAll(userId: number): Promise<Todo[]> {
    return this.todoRepository.find({ where: { UserId: userId }, order: { id: 'DESC' } });
  }

  async setDone(id: number, isDone: boolean, userId: number): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id, UserId: userId }});
    if (!todo) {
      throw new Error('Todo not found');
    }
    todo.isDone = isDone;
    return this.todoRepository.save(todo);
  }
}
