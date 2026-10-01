export type ServiceName = 'identity' | 'management';

export interface HealthStatus {
  status: string;
}

export async function fetchHealth(service: ServiceName): Promise<HealthStatus> {
  const response = await fetch(`/api/${service}/health`);
  if (!response.ok) {
    throw new Error(`${service} responded with ${response.status}`);
  }
  return response.json() as Promise<HealthStatus>;
}
