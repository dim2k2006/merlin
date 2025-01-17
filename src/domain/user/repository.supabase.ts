import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';
import { User } from './model';

type ConstructorInput = {
  supabaseUrl: string;
  supabaseKey: string;
};

class RepositorySupabase {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor({ supabaseUrl, supabaseKey }: ConstructorInput) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async createUser(user: User): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.createdAt,
      })
      .select();

    if (error) {
      throw error;
    }

    return this.transformUser(data[0]);
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.from('users').select().eq('id', id);

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return null;
    }

    return this.transformUser(data[0]);
  }

  async updateUser(user: User): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        name: user.name,
        email: user.email,
      })
      .eq('id', user.id)
      .select();

    if (error) {
      throw error;
    }

    return this.transformUser(data[0]);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase.from('users').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  private transformUser(user: Database['public']['Tables']['users']['Row']): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    };
  }
}

export default RepositorySupabase;
