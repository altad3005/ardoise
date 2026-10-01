import { healthStatusSchema, type HealthStatus } from '@ardoise/types';

export type ServiceName = 'identity' | 'management';

export async function fetchHealth(service: ServiceName): Promise<HealthStatus> {
  const response = await fetch(`/api/${service}/health`);
  if (!response.ok) {
    throw new Error(`${service} responded with ${response.status}`);
  }
  return healthStatusSchema.parse(await response.json());
}
