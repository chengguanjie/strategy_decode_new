export type DimensionLayer = 'upper' | 'lower';

export interface DimensionBlock {
  id: string;
  name: string;
  layer: DimensionLayer;
  description: string;
  icon?: string;
}

export interface BlockContent {
  title: string;
  coreProblem: string;
  knowledgeFramework: string[];
  winningPoints: string[];
  actionPlan: string[];
  keyMetrics: string[];
}

export interface RoleConfig {
  name: string;
  headcount: number;
  description: string;
  persona: string;
}

export interface DeptConfig {
  responsibilities: string;
  roles: RoleConfig[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  tags: string[];
}

export interface DepartmentNode {
  key: string;
  title: string;
  children?: DepartmentNode[];
}

export interface Column {
  id: string;
  title: string;
  width?: number;
}

export interface Row {
  id: string;
  [key: string]: string | number | undefined;
}
