import { User } from './user.model';

export interface UserService {
  createUser(user: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export type CreateUserInput = {
  id?: string;
  externalId: string;
  firstName: string;
  lastName: string;
};
