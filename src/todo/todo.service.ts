import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
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
}
