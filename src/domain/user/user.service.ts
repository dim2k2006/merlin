import { v4 as uuidV4 } from 'uuid';
import { User } from './user.model';
import { UserRepositoryInterface } from './user.repository.interface';
import { UserServiceInterface, CreateUserInput } from './user.service.interface';

type ConstructorInput = {
  userRepository: UserRepositoryInterface;
};

class UserService implements UserServiceInterface {
  private readonly userRepository: UserRepositoryInterface;

  constructor({ userRepository }: ConstructorInput) {
    this.userRepository = userRepository;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user = {
      id: input.id ?? uuidV4(),
      name: input.name,
      email: input.email,
      createdAt: new Date().toISOString(),
    };

    return this.userRepository.createUser(user);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findUserById(id);
  }

  async updateUser(user: User): Promise<User> {
    return this.userRepository.updateUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.deleteUser(id);
  }
}

export default UserService;
