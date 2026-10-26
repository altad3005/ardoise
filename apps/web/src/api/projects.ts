import {
  projectCategoryListSchema,
  projectCategorySchema,
  projectListSchema,
  projectSchema,
  type NewProject,
  type NewProjectCategory,
  type ProjectCategory,
  type ProjectCategoryChanges,
  type ProjectChanges,
  type TreasuryProject,
} from '@ardoise/types';
import { ApiError } from './api-error.ts';

const categoriesUrl = '/api/management/project-categories';
const projectsUrl = '/api/management/projects';

export async function fetchProjectCategories(): Promise<ProjectCategory[]> {
  return projectCategoryListSchema.parse(await getJson(categoriesUrl));
}

export async function createProjectCategory(
  newCategory: NewProjectCategory,
): Promise<ProjectCategory> {
  return projectCategorySchema.parse(await sendJson(categoriesUrl, 'POST', newCategory));
}

export async function renameProjectCategory(
  categoryId: string,
  changes: ProjectCategoryChanges,
): Promise<ProjectCategory> {
  return projectCategorySchema.parse(
    await sendJson(`${categoriesUrl}/${categoryId}`, 'PATCH', changes),
  );
}

export async function fetchProjects(): Promise<TreasuryProject[]> {
  return projectListSchema.parse(await getJson(projectsUrl));
}

export async function createProject(newProject: NewProject): Promise<TreasuryProject> {
  return projectSchema.parse(await sendJson(projectsUrl, 'POST', newProject));
}

export async function updateProject(
  projectId: string,
  changes: ProjectChanges,
): Promise<TreasuryProject> {
  return projectSchema.parse(await sendJson(`${projectsUrl}/${projectId}`, 'PATCH', changes));
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return response.json();
}

async function sendJson(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return response.json();
}
