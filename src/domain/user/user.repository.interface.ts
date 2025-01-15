import { User } from './user.model';

export interface UserRepositoryInterface {
  createUser(user: CreateUserInput): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export type CreateUserInput = {
  id?: string;
  name: string;
  email: string;
};
