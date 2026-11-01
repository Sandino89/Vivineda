export type UserRole = 'admin' | 'almacenista' | 'ingeniero_obras' | 'consulta';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  department: string;
  active: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'disponible' | 'stock_bajo' | 'agotado';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  unitCost: number;
  warehouse: string;
  supplierName: string;
  status: StockStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  rif: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  specialty: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Beneficiary {
  id: string;
  cedulaRif: string;
  name: string;
  parish: string;
  sector: string;
  phone: string;
  projectAssigned: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Movement {
  id: string;
  type: MovementType;
  productId: string;
  productCode: string;
  productName: string;
  unit?: string;
  unitCost?: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceDoc: string;
  parish: string;
  projectName: string;
  counterparty: string;
  responsibleName: string;
  notes: string;
  date: string;
  ownerId: string;
  createdAt: string;
}

export type ProjectStatus = 'en_ejecucion' | 'planificado' | 'pausado' | 'culminado';

export interface ProjectWork {
  id: string;
  code: string;
  name: string;
  parish: string;
  sector: string;
  engineer: string;
  beneficiariesCount: number;
  budgetUsd: number;
  spentUsd: number;
  physicalProgress: number;
  financialProgress: number;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  lastUpdateNote: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParishPriorityMetric {
  parish: string;
  rank: number;
  projectsCount: number;
  activeProjectsCount: number;
  beneficiariesFamilies: number;
  dispatchedUnits: number;
  dispatchedMovementsCount: number;
  dispatchedValueUsd: number;
  budgetUsd: number;
  spentUsd: number;
  avgPhysicalProgress: number;
  prioritySharePercent: number;
  priorityLevel: 'Prioridad Alta' | 'Prioridad Media' | 'En Atención';
}

export type PermissionAction =
  | 'manage_inventory'
  | 'register_movements'
  | 'manage_projects'
  | 'manage_users'
  | 'export_reports'
  | 'sync_sheets'
  | 'delete_records';
