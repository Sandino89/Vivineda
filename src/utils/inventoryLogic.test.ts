import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStockStatus,
  calculateMovementResult,
  hasPermission,
  calculateDashboardMetrics,
  calculateParishPriorityMetrics,
  filterProducts,
} from './inventoryLogic';
import { Product, Movement, ProjectWork } from '../types/inventory';

test('computeStockStatus identifies disponible, stock_bajo, and agotado accurately', () => {
  assert.equal(computeStockStatus(100, 20), 'disponible');
  assert.equal(computeStockStatus(20, 20), 'stock_bajo');
  assert.equal(computeStockStatus(5, 20), 'stock_bajo');
  assert.equal(computeStockStatus(0, 20), 'agotado');
});

test('calculateMovementResult handles ENTRADA, SALIDA, and prevents negative stock', () => {
  const entry = calculateMovementResult(50, 20, 'ENTRADA', 30);
  assert.equal(entry.valid, true);
  assert.equal(entry.newStock, 80);
  assert.equal(entry.newStatus, 'disponible');

  const validExit = calculateMovementResult(50, 20, 'SALIDA', 35);
  assert.equal(validExit.valid, true);
  assert.equal(validExit.newStock, 15);
  assert.equal(validExit.newStatus, 'stock_bajo');

  const invalidExit = calculateMovementResult(10, 20, 'SALIDA', 25);
  assert.equal(invalidExit.valid, false);
  assert.equal(invalidExit.newStock, 10);
  assert.ok(invalidExit.error?.includes('Stock insuficiente'));
});

test('hasPermission enforces RBAC matrix by role', () => {
  assert.equal(hasPermission('admin', 'manage_users'), true);
  assert.equal(hasPermission('admin', 'delete_records'), true);
  assert.equal(hasPermission('almacenista', 'register_movements'), true);
  assert.equal(hasPermission('almacenista', 'manage_users'), false);
  assert.equal(hasPermission('ingeniero_obras', 'manage_projects'), true);
  assert.equal(hasPermission('ingeniero_obras', 'manage_inventory'), false);
  assert.equal(hasPermission('consulta', 'export_reports'), true);
  assert.equal(hasPermission('consulta', 'register_movements'), false);
});

test('calculateDashboardMetrics and calculateParishPriorityMetrics rank parishes accurately', () => {
  const products: Product[] = [
    {
      id: 'p1',
      code: 'MAT-001',
      name: 'Cemento Gris',
      category: 'Cementos',
      unit: 'Saco',
      stock: 100,
      minStock: 50,
      unitCost: 8.5,
      warehouse: 'Almacén Central',
      supplierName: 'Vencemos',
      status: 'disponible',
      ownerId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'p2',
      code: 'MAT-002',
      name: 'Lámina Acerolit',
      category: 'Techos',
      unit: 'Unidad',
      stock: 10,
      minStock: 25,
      unitCost: 22,
      warehouse: 'Almacén Central',
      supplierName: 'Hierro Zulia',
      status: 'stock_bajo',
      ownerId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const movements: Movement[] = [
    {
      id: 'm1',
      type: 'SALIDA',
      productId: 'p1',
      productCode: 'MAT-001',
      productName: 'Cemento Gris',
      unit: 'Saco',
      unitCost: 8.5,
      quantity: 100,
      previousStock: 200,
      newStock: 100,
      referenceDoc: 'GD-001',
      parish: 'José Domingo Rus',
      projectName: 'Rehabilitación El Soler',
      counterparty: 'Consejo Comunal El Soler',
      responsibleName: 'Admin',
      notes: '',
      date: '2026-11-01',
      ownerId: 'u1',
      createdAt: '',
    },
  ];

  const projects: ProjectWork[] = [
    {
      id: 'pr1',
      code: 'OBR-01',
      name: 'Rehabilitación El Soler',
      parish: 'José Domingo Rus',
      sector: 'Lote 4',
      engineer: 'Ing. Carlos Nava',
      beneficiariesCount: 45,
      budgetUsd: 25000,
      spentUsd: 15000,
      physicalProgress: 60,
      financialProgress: 60,
      status: 'en_ejecucion',
      startDate: '2026-09-01',
      targetDate: '2026-12-15',
      lastUpdateNote: 'Avance normal',
      ownerId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const metrics = calculateDashboardMetrics(products, movements, projects);
  assert.equal(metrics.totalProducts, 2);
  assert.equal(metrics.totalUnits, 110);
  assert.equal(metrics.totalInventoryValueUsd, 1070);

  const parishMetrics = calculateParishPriorityMetrics(
    ['José Domingo Rus', 'San Francisco'],
    projects,
    movements,
    products
  );
  assert.equal(parishMetrics[0].parish, 'José Domingo Rus');
  assert.equal(parishMetrics[0].rank, 1);
  assert.equal(parishMetrics[0].dispatchedUnits, 100);
  assert.equal(parishMetrics[0].dispatchedValueUsd, 850);

  const filtered = filterProducts(products, 'Acerolit', 'TODAS', 'stock_bajo', 'TODOS');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].code, 'MAT-002');
});
