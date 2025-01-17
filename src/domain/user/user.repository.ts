import { User } from './user.model';

export interface UserRepository {
  createUser(user: User): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
