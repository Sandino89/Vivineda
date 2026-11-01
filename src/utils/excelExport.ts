import * as XLSX from 'xlsx';
import {
  Product,
  Category,
  Supplier,
  Beneficiary,
  Movement,
  ProjectWork,
  AppUser,
  ParishPriorityMetric,
} from '../types/inventory';

export function exportProductsToExcel(products: Product[]) {
  const rows = products.map((p) => ({
    Código: p.code,
    Material_Producto: p.name,
    Categoría: p.category,
    Unidad: p.unit,
    Stock_Actual: p.stock,
    Stock_Mínimo: p.minStock,
    Costo_Unitario_USD: p.unitCost,
    Valor_Total_USD: Number((p.stock * p.unitCost).toFixed(2)),
    Almacén: p.warehouse,
    Proveedor: p.supplierName,
    Estado:
      p.status === 'disponible'
        ? 'Disponible'
        : p.status === 'stock_bajo'
        ? 'Stock Bajo'
        : 'Agotado',
    Última_Actualización: p.updatedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  XLSX.writeFile(workbook, 'Inventario_Materiales_SIVYH_SanFrancisco.xlsx');
}

export function exportMovementsToExcel(movements: Movement[]) {
  const rows = movements.map((m) => {
    const unitCost = m.unitCost ?? 0;
    const totalUsd = Number((m.quantity * unitCost).toFixed(2));
    return {
      Fecha: m.date,
      Tipo_Movimiento: m.type,
      Factura_Guía: m.referenceDoc,
      Parroquia_San_Francisco: m.parish || 'San Francisco',
      Código_Material: m.productCode,
      Material: m.productName,
      Unidad: m.unit || 'Unidad',
      Cantidad: m.quantity,
      Costo_Unitario_USD: unitCost,
      Monto_Total_USD: totalUsd,
      Stock_Anterior: m.previousStock,
      Stock_Resultante: m.newStock,
      Obra_Proyecto: m.projectName,
      Proveedor_Beneficiario: m.counterparty,
      Responsable: m.responsibleName,
      Observaciones: m.notes,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos_Kardex');
  XLSX.writeFile(workbook, 'Historial_Movimientos_SIVYH_SanFrancisco.xlsx');
}

export function exportInvoiceToExcel(movement: Movement, product?: Product) {
  const unit = movement.unit || product?.unit || 'Unidad';
  const unitCost = movement.unitCost ?? product?.unitCost ?? 0;
  const totalValue = Number((movement.quantity * unitCost).toFixed(2));

  const rows = [
    {
      Institución: 'Alcaldía Bolivariana de San Francisco - Dirección de Vivienda y Hábitat',
      RIF_Institucional: 'G-20000891-4',
      Tipo_Factura:
        movement.type === 'ENTRADA'
          ? 'FACTURA / COMPROBANTE DE ENTRADA DE MATERIAL'
          : 'FACTURA / ORDEN DE SALIDA Y DESPACHO DE MATERIAL',
      Número_Control_Factura: movement.referenceDoc,
      Fecha_Emisión: movement.date,
      Parroquia_Destino_Origen: movement.parish || 'San Francisco',
      Obra_Proyecto: movement.projectName,
      Proveedor_o_Beneficiario: movement.counterparty,
      Código_Material: movement.productCode,
      Descripción_Material: movement.productName,
      Unidad_Medida: unit,
      Cantidad: movement.quantity,
      Precio_Unitario_USD: unitCost,
      Total_Valorizado_USD: totalValue,
      Saldo_Anterior_Almacén: movement.previousStock,
      Saldo_Nuevo_Almacén: movement.newStock,
      Funcionario_Responsable: movement.responsibleName,
      Observaciones: movement.notes || 'Despacho verificado y auditado por SIVYH.',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Factura_Comprobante');
  XLSX.writeFile(
    workbook,
    `Factura_${movement.type}_${movement.referenceDoc}_SanFrancisco.xlsx`
  );
}

export function exportParishPriorityToExcel(metrics: ParishPriorityMetric[]) {
  const rows = metrics.map((m) => ({
    Ranking_Prioridad: `#${m.rank}`,
    Nivel_Prioridad: m.priorityLevel,
    Parroquia_San_Francisco: m.parish,
    Porcentaje_Atención_Municipal: `${m.prioritySharePercent}%`,
    Obras_Registradas: m.projectsCount,
    Obras_En_Ejecución: m.activeProjectsCount,
    Familias_Beneficiadas: m.beneficiariesFamilies,
    Unidades_Material_Despachadas: m.dispatchedUnits,
    Valor_Materiales_Despachados_USD: m.dispatchedValueUsd,
    Presupuesto_Obras_USD: m.budgetUsd,
    Inversión_Ejecutada_USD: m.spentUsd,
    Avance_Físico_Promedio: `${m.avgPhysicalProgress}%`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prioridad_Parroquias');
  XLSX.writeFile(
    workbook,
    'Reporte_Prioridad_Parroquias_SanFrancisco_Zulia.xlsx'
  );
}

export function exportProjectsToExcel(projects: ProjectWork[]) {
  const rows = projects.map((p) => ({
    Código_Obra: p.code,
    Nombre_Obra_Proyecto: p.name,
    Parroquia: p.parish,
    Sector: p.sector,
    Ingeniero_Inspector: p.engineer,
    Familias_Beneficiadas: p.beneficiariesCount,
    Presupuesto_USD: p.budgetUsd,
    Ejecutado_USD: p.spentUsd,
    Avance_Físico_Porc: `${p.physicalProgress}%`,
    Avance_Financiero_Porc: `${p.financialProgress}%`,
    Estado: p.status.toUpperCase(),
    Fecha_Inicio: p.startDate,
    Fecha_Meta: p.targetDate,
    Último_Reporte: p.lastUpdateNote,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Avance_Obras');
  XLSX.writeFile(workbook, 'Reporte_Avance_Obras_SIVYH_SanFrancisco.xlsx');
}

/**
 * Exports the complete 7-sheet database workbook ready to upload directly to Google Drive / Google Sheets.
 */
export function exportFullGoogleSheetsTemplate(data: {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  beneficiaries: Beneficiary[];
  movements: Movement[];
  projects: ProjectWork[];
  users: AppUser[];
}) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.products),
    'Productos'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.categories),
    'Categorias'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.suppliers),
    'Proveedores'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.beneficiaries),
    'Beneficiarios'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.movements),
    'Movimientos'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.projects),
    'Obras'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      data.users.map(({ password, ...rest }) => ({
        ...rest,
        password_hash: password ? '***' : 'firebase_auth',
      }))
    ),
    'Usuarios'
  );

  XLSX.writeFile(
    workbook,
    'Base_Datos_GoogleSheets_SIVYH_SanFrancisco.xlsx'
  );
}
