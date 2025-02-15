import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import {
  ParameterProvider,
  CreateParameterInput,
  Parameter,
  CreateMeasurementInput,
  Measurement,
} from './parameter.provider';
import { handleAxiosError } from '../../utils/axios';

const ParameterResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  dataType: z.union([z.literal('float'), z.literal('boolean')]),
  unit: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type ConstructorInput = {
  apiKey: string;
};

class ParameterProviderCorrelate implements ParameterProvider {
  private readonly apiKey: string;

  private readonly client: AxiosInstance;

  private readonly baseUrl: string;

  constructor({ apiKey }: ConstructorInput) {
    this.apiKey = apiKey;

    const baseURL = 'https://correlateapp-be.onrender.com';

    this.baseUrl = baseURL;

    this.client = axios.create({
      baseURL,
    });
  }

  async createParameter(input: CreateParameterInput): Promise<Parameter> {
    const url = '/api/parameters';

    try {
      const response = await this.client.post(url, {
        userId: input.userId,
        name: input.name,
        description: input.description,
        dataType: input.dataType,
        unit: input.unit,
      });

      const result = ParameterResponseSchema.parse(response.data);

      return result;
    } catch (error) {
      return handleAxiosError(error, `${this.baseUrl}${url}`);
    }
  }

  async listParametersByUser(userId: string): Promise<Parameter[]> {
    const url = `/api/parameters/user/${userId}`;

    try {
      const response = await this.client.get(url);

      const result = z.array(ParameterResponseSchema).parse(response.data);

      return result;
    } catch (error) {
      return handleAxiosError(error, `${this.baseUrl}${url}`);
    }
  }

  async createMeasurement(input: CreateMeasurementInput): Promise<Measurement> {
    // Implementation details
    return {} as Measurement;
  }

  async listMeasurementsByParameter(parameterId: string): Promise<Measurement[]> {
    // Implementation details
    return [] as Measurement[];
  }
}

export default ParameterProviderCorrelate;
