'use client';
import type { Project, Task } from './types';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Christmas Dinner',
    description: 'A festive feast for the whole family.',
    ownerId: 'user_123',
    recipes: [
      { id: 'rec_1', name: 'Roast Turkey' },
      { id: 'rec_2', name: 'Mashed Potatoes' },
    ],
    tasks: [
      { id: 'task_1', name: 'Preheat oven', duration: 600, recipeId: 'rec_1', predecessorIds: [], status: 'pending' },
      { id: 'task_2', name: 'Prepare turkey', duration: 1800, recipeId: 'rec_1', predecessorIds: [], status: 'pending' },
      { id: 'task_3', name: 'Roast turkey', duration: 10800, recipeId: 'rec_1', predecessorIds: ['task_1', 'task_2'], status: 'pending' },
      { id: 'task_4', name: 'Peel potatoes', duration: 900, recipeId: 'rec_2', predecessorIds: [], status: 'pending' },
      { id: 'task_5', name: 'Boil potatoes', duration: 1200, recipeId: 'rec_2', predecessorIds: ['task_4'], status: 'pending' },
      { id: 'task_6', name: 'Mash potatoes', duration: 300, recipeId: 'rec_2', predecessorIds: ['task_5'], status: 'pending' },
      { id: 'task_7', name: 'Let turkey rest', duration: 1800, recipeId: 'rec_1', predecessorIds: ['task_3'], status: 'pending' },
    ],
  },
  {
    id: 'proj_2',
    name: 'Summer BBQ',
    description: 'Grilling and chilling in the sun.',
    ownerId: 'user_123',
    recipes: [{ id: 'rec_3', name: 'Burgers' }],
    tasks: [],
  },
    {
    id: 'proj_3',
    name: 'Weekly Meal Prep',
    description: 'Healthy meals for the week ahead.',
    ownerId: 'user_123',
    recipes: [],
    tasks: [],
  },
];

const STORAGE_KEY = 'optimal-cook-projects';

const getProjectsFromStorage = (): Project[] => {
  if (typeof window === 'undefined') return MOCK_PROJECTS;
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PROJECTS));
  return MOCK_PROJECTS;
};

const saveProjectsToStorage = (projects: Project[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
};

export const getProjects = (): Project[] => {
  return getProjectsFromStorage();
};

export const getProject = (id: string): Project | undefined => {
  const projects = getProjectsFromStorage();
  return projects.find((p) => p.id === id);
};

export const saveProject = (project: Project): Project => {
  let projects = getProjectsFromStorage();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index > -1) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjectsToStorage(projects);
  return project;
};

export const createProject = (projectData: Omit<Project, 'id' | 'ownerId' | 'recipes' | 'tasks'>): Project => {
  const projects = getProjectsFromStorage();
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    ownerId: 'user_123',
    recipes: [],
    tasks: [],
    ...projectData,
  };
  projects.push(newProject);
  saveProjectsToStorage(projects);
  return newProject;
};

export const deleteProject = (id: string) => {
  let projects = getProjectsFromStorage();
  projects = projects.filter((p) => p.id !== id);
  saveProjectsToStorage(projects);
};
