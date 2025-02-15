import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import {
  ParameterProvider,
  CreateParameterInput,
  Parameter,
  CreateMeasurementInput,
  Measurement,
  User,
} from './parameter.provider';
import { handleAxiosError } from '../../utils/axios';

const ParameterResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  dataType: z.enum(['float']),
  unit: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const UserResponseSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const BaseMeasurementSchema = z.object({
  type: z.literal('float'), // MeasurementType is only 'float'
  id: z.string(),
  userId: z.string(),
  parameterId: z.string(),
  timestamp: z.string(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// MeasurementFloat schema extends BaseMeasurementSchema with a value property.
const MeasurementFloatSchema = BaseMeasurementSchema.extend({
  value: z.number(),
});

// Since Measurement is only defined as MeasurementFloat, we export it as MeasurementSchema.
const MeasurementResponseSchema = MeasurementFloatSchema;

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

  async getUserByExternalID(externalId: string): Promise<User> {
    const url = `/api/users/external/${externalId}`;

    try {
      const response = await this.client.get(url);

      const result = UserResponseSchema.parse(response.data);

      return result;
    } catch (error) {
      return handleAxiosError(error, `${this.baseUrl}${url}`);
    }
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
    const url = '/api/measurements';

    try {
      const response = await this.client.post(url, {
        parameterId: input.parameterId,
        notes: input.notes,
        value: input.value,
      });

      const result = MeasurementResponseSchema.parse(response.data);

      return result;
    } catch (error) {
      return handleAxiosError(error, `${this.baseUrl}${url}`);
    }
  }

  async listMeasurementsByParameter(parameterId: string): Promise<Measurement[]> {
    const url = `/api/measurements/parameter/${parameterId}`;

    try {
      const response = await this.client.get(url);

      const result = z.array(MeasurementResponseSchema).parse(response.data);

      return result;
    } catch (error) {
      return handleAxiosError(error, `${this.baseUrl}${url}`);
    }
  }
}

export default ParameterProviderCorrelate;
