import { User } from './user.model';
import { UserRepositoryInterface, CreateUserInput } from './user.repository.interface';
import { UserServiceInterface } from './user.service.interface';

type ConstructorInput = {
  userRepository: UserRepositoryInterface;
};

class UserService implements UserServiceInterface {
  private readonly userRepository: UserRepositoryInterface;

  constructor({ userRepository }: ConstructorInput) {
    this.userRepository = userRepository;
  }

  async createUser(user: CreateUserInput): Promise<User> {
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
