import { v4 as uuidV4 } from 'uuid';
import { User } from './user.model';
import { UserRepository } from './user.repository';
import { UserService, CreateUserInput } from './user.service';

type ConstructorInput = {
  userRepository: UserRepository;
};

class UserServiceImpl implements UserService {
  private readonly userRepository: UserRepository;

  constructor({ userRepository }: ConstructorInput) {
    this.userRepository = userRepository;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user = {
      id: input.id ?? uuidV4(),
      externalId: input.externalId,
      firstName: input.firstName,
      lastName: input.lastName,
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

export default UserServiceImpl;
