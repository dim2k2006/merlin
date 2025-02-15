export interface ParameterProvider {
  createParameter(input: CreateParameterInput): Promise<Parameter>;
  listParametersByUser(userId: string): Promise<Parameter[]>;

  createMeasurement(input: CreateMeasurementInput): Promise<Measurement>;
  listMeasurementsByParameter(parameterId: string): Promise<Measurement[]>;
}

type CreateParameterInput = {
  userId: string;
  name: string;
  description: string;
  dataType: ParameterType;
  unit: string;
};

type Parameter = {
  id: string;
  userId: string;
  name: string;
  description: string;
  dataType: ParameterType;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

type ParameterType = 'float';

type CreateMeasurementInput = {
  parameterId: string;
  notes: string;
  value: unknown;
};

type MeasurementType = 'float';

type Measurement = MeasurementFloat;

type MeasurementFloat = BaseMeasurement & {
  type: 'float';
  value: number;
};

type BaseMeasurement = {
  type: MeasurementType;
  id: string;
  userId: string;
  parameterId: string;
  timestamp: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
