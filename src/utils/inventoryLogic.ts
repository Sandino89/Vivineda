import {
  Product,
  StockStatus,
  Movement,
  MovementType,
  ProjectWork,
  UserRole,
  PermissionAction,
  ParishPriorityMetric,
} from '../types/inventory';

/**
 * Computes the semantic stock status based on current stock and minimum threshold.
 */
export function computeStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'agotado';
  if (stock <= minStock) return 'stock_bajo';
  return 'disponible';
}

/**
 * Applies a stock movement (ENTRADA, SALIDA, or AJUSTE) and validates stock availability.
 */
export function calculateMovementResult(
  currentStock: number,
  minStock: number,
  type: MovementType,
  quantity: number
): { valid: boolean; newStock: number; newStatus: StockStatus; error?: string } {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      valid: false,
      newStock: currentStock,
      newStatus: computeStockStatus(currentStock, minStock),
      error: 'La cantidad debe ser mayor a cero.',
    };
  }

  let newStock = currentStock;
  if (type === 'ENTRADA') {
    newStock = currentStock + quantity;
  } else if (type === 'SALIDA') {
    if (quantity > currentStock) {
      return {
        valid: false,
        newStock: currentStock,
        newStatus: computeStockStatus(currentStock, minStock),
        error: `Stock insuficiente. Disponible actual: ${currentStock}.`,
      };
    }
    newStock = currentStock - quantity;
  } else if (type === 'AJUSTE') {
    newStock = quantity;
  }

  return {
    valid: true,
    newStock,
    newStatus: computeStockStatus(newStock, minStock),
  };
}

/**
 * Role-based access control matrix for Dirección de Vivienda y Hábitat.
 */
const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'manage_inventory',
    'register_movements',
    'manage_projects',
    'manage_users',
    'export_reports',
    'sync_sheets',
    'delete_records',
  ],
  almacenista: [
    'manage_inventory',
    'register_movements',
    'export_reports',
    'sync_sheets',
  ],
  ingeniero_obras: [
    'register_movements',
    'manage_projects',
    'export_reports',
  ],
  consulta: ['export_reports'],
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador General';
    case 'almacenista':
      return 'Jefe de Almacén y Despacho';
    case 'ingeniero_obras':
      return 'Ingeniero Inspector de Obras';
    case 'consulta':
      return 'Auditor / Consulta Institucional';
  }
}

/**
 * Computes summary KPIs for the main dashboard.
 */
export function calculateDashboardMetrics(
  products: Product[],
  movements: Movement[],
  projects: ProjectWork[]
) {
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValueUsd = products.reduce(
    (acc, p) => acc + p.stock * p.unitCost,
    0
  );
  const lowStockCount = products.filter((p) => p.status === 'stock_bajo').length;
  const outOfStockCount = products.filter((p) => p.status === 'agotado').length;
  const criticalAlertsCount = lowStockCount + outOfStockCount;

  const entriesCount = movements.filter((m) => m.type === 'ENTRADA').length;
  const exitsCount = movements.filter((m) => m.type === 'SALIDA').length;

  const activeProjects = projects.filter((p) => p.status === 'en_ejecucion').length;
  const avgPhysicalProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + p.physicalProgress, 0) / projects.length
        )
      : 0;
  const totalBeneficiariesFamilies = projects.reduce(
    (acc, p) => acc + p.beneficiariesCount,
    0
  );

  return {
    totalProducts,
    totalUnits,
    totalInventoryValueUsd: Number(totalInventoryValueUsd.toFixed(2)),
    lowStockCount,
    outOfStockCount,
    criticalAlertsCount,
    entriesCount,
    exitsCount,
    activeProjects,
    avgPhysicalProgress,
    totalBeneficiariesFamilies,
  };
}

/**
 * Calculates priority metrics across all 7 parishes of Municipio San Francisco, Edo. Zulia.
 */
export function calculateParishPriorityMetrics(
  parishes: string[],
  projects: ProjectWork[],
  movements: Movement[],
  products: Product[]
): ParishPriorityMetric[] {
  const productCostMap = new Map<string, number>();
  products.forEach((p) => productCostMap.set(p.id, p.unitCost));

  const rawMetrics = parishes.map((parish) => {
    const parishProjects = projects.filter((p) => p.parish === parish);
    const activeProjectsCount = parishProjects.filter(
      (p) => p.status === 'en_ejecucion'
    ).length;
    const beneficiariesFamilies = parishProjects.reduce(
      (acc, p) => acc + p.beneficiariesCount,
      0
    );
    const budgetUsd = parishProjects.reduce((acc, p) => acc + p.budgetUsd, 0);
    const spentUsd = parishProjects.reduce((acc, p) => acc + p.spentUsd, 0);
    const avgPhysicalProgress =
      parishProjects.length > 0
        ? Math.round(
            parishProjects.reduce((acc, p) => acc + p.physicalProgress, 0) /
              parishProjects.length
          )
        : 0;

    const parishExits = movements.filter(
      (m) => m.type === 'SALIDA' && m.parish === parish
    );
    const dispatchedUnits = parishExits.reduce((acc, m) => acc + m.quantity, 0);
    const dispatchedValueUsd = parishExits.reduce((acc, m) => {
      const unitCost = m.unitCost ?? productCostMap.get(m.productId) ?? 0;
      return acc + m.quantity * unitCost;
    }, 0);

    // Weighted composite score combining executed investment, dispatched material value, and families served
    const compositeScore =
      spentUsd + dispatchedValueUsd * 2 + beneficiariesFamilies * 100;

    return {
      parish,
      projectsCount: parishProjects.length,
      activeProjectsCount,
      beneficiariesFamilies,
      dispatchedUnits,
      dispatchedMovementsCount: parishExits.length,
      dispatchedValueUsd: Number(dispatchedValueUsd.toFixed(2)),
      budgetUsd,
      spentUsd,
      avgPhysicalProgress,
      compositeScore,
    };
  });

  const totalScore = rawMetrics.reduce((acc, m) => acc + m.compositeScore, 0);

  const sorted = [...rawMetrics].sort(
    (a, b) => b.compositeScore - a.compositeScore
  );

  return sorted.map((item, idx) => {
    const share =
      totalScore > 0
        ? Number(((item.compositeScore / totalScore) * 100).toFixed(1))
        : 0;
    const priorityLevel: ParishPriorityMetric['priorityLevel'] =
      idx < 3
        ? 'Prioridad Alta'
        : idx < 5
        ? 'Prioridad Media'
        : 'En Atención';

    return {
      parish: item.parish,
      rank: idx + 1,
      projectsCount: item.projectsCount,
      activeProjectsCount: item.activeProjectsCount,
      beneficiariesFamilies: item.beneficiariesFamilies,
      dispatchedUnits: item.dispatchedUnits,
      dispatchedMovementsCount: item.dispatchedMovementsCount,
      dispatchedValueUsd: item.dispatchedValueUsd,
      budgetUsd: item.budgetUsd,
      spentUsd: item.spentUsd,
      avgPhysicalProgress: item.avgPhysicalProgress,
      prioritySharePercent: share,
      priorityLevel,
    };
  });
}

/**
 * Multi-criteria filter for products.
 */
export function filterProducts(
  products: Product[],
  query: string,
  categoryFilter: string,
  statusFilter: string,
  warehouseFilter: string
): Product[] {
  const normalizedQuery = query.trim().toLowerCase();
  return products.filter((p) => {
    const matchesQuery =
      !normalizedQuery ||
      p.code.toLowerCase().includes(normalizedQuery) ||
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.supplierName.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      categoryFilter === 'TODAS' || p.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'TODOS' || p.status === statusFilter;

    const matchesWarehouse =
      warehouseFilter === 'TODOS' || p.warehouse === warehouseFilter;

    return matchesQuery && matchesCategory && matchesStatus && matchesWarehouse;
  });
}

/**
 * Multi-criteria filter for stock movements (including parish filter).
 */
export function filterMovements(
  movements: Movement[],
  query: string,
  typeFilter: string,
  projectFilter: string,
  parishFilter = 'TODAS'
): Movement[] {
  const normalizedQuery = query.trim().toLowerCase();
  return movements.filter((m) => {
    const matchesQuery =
      !normalizedQuery ||
      m.productCode.toLowerCase().includes(normalizedQuery) ||
      m.productName.toLowerCase().includes(normalizedQuery) ||
      m.referenceDoc.toLowerCase().includes(normalizedQuery) ||
      m.responsibleName.toLowerCase().includes(normalizedQuery) ||
      m.counterparty.toLowerCase().includes(normalizedQuery) ||
      m.projectName.toLowerCase().includes(normalizedQuery) ||
      (m.parish && m.parish.toLowerCase().includes(normalizedQuery));

    const matchesType = typeFilter === 'TODOS' || m.type === typeFilter;
    const matchesProject =
      projectFilter === 'TODOS' || m.projectName === projectFilter;
    const matchesParish =
      parishFilter === 'TODAS' || m.parish === parishFilter;

    return matchesQuery && matchesType && matchesProject && matchesParish;
  });
}
