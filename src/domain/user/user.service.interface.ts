import { User } from './user.model';
import { CreateUserInput } from './user.repository.interface';

export interface UserServiceInterface {
  createUser(user: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
