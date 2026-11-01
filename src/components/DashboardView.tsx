import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Package,
  AlertTriangle,
  HardHat,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  PlusCircle,
  MapPin,
  FileText,
} from 'lucide-react';
import { Product, Movement, ProjectWork } from '../types/inventory';
import {
  calculateDashboardMetrics,
  calculateParishPriorityMetrics,
} from '../utils/inventoryLogic';
import { SAN_FRANCISCO_PARISHES } from '../data/seedData';
import {
  exportProductsToExcel,
  exportMovementsToExcel,
  exportProjectsToExcel,
  exportParishPriorityToExcel,
} from '../utils/excelExport';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardViewProps {
  products: Product[];
  movements: Movement[];
  projects: ProjectWork[];
  onNavigate: (view: string) => void;
  onSelectInvoice: (movement: Movement) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  movements,
  projects,
  onNavigate,
  onSelectInvoice,
}) => {
  const metrics = calculateDashboardMetrics(products, movements, projects);
  const parishPriority = calculateParishPriorityMetrics(
    SAN_FRANCISCO_PARISHES,
    projects,
    movements,
    products
  );
  const topParish = parishPriority[0];

  // Datos para Gráfico de Barras: Stock Actual vs Stock Mínimo
  const topProducts = products.slice(0, 6);
  const stockBarData = {
    labels: topProducts.map((p) =>
      p.name.length > 22 ? p.name.slice(0, 22) + '...' : p.name
    ),
    datasets: [
      {
        label: 'Stock Disponible',
        data: topProducts.map((p) => p.stock),
        backgroundColor: '#003B73',
        borderRadius: 4,
      },
      {
        label: 'Stock Mínimo Requerido',
        data: topProducts.map((p) => p.minStock),
        backgroundColor: '#C8102E',
        borderRadius: 4,
      },
    ],
  };

  // Datos para Gráfico de Prioridad por Parroquia (7 Parroquias de San Francisco)
  const parishChartData = {
    labels: parishPriority.map((p) => p.parish),
    datasets: [
      {
        label: 'Inversión Ejecutada en Obras (USD)',
        data: parishPriority.map((p) => p.spentUsd),
        backgroundColor: '#003B73',
        borderRadius: 4,
      },
      {
        label: 'Materiales Despachados de Almacén (USD)',
        data: parishPriority.map((p) => p.dispatchedValueUsd),
        backgroundColor: '#C8102E',
        borderRadius: 4,
      },
    ],
  };

  // Datos para Gráfico Doughnut: Valorización por Categoría
  const categoryTotals: Record<string, number> = {};
  products.forEach((p) => {
    categoryTotals[p.category] =
      (categoryTotals[p.category] || 0) + p.stock * p.unitCost;
  });

  const categoryLabels = Object.keys(categoryTotals);
  const categoryDoughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryLabels.map((c) => Number(categoryTotals[c].toFixed(2))),
        backgroundColor: [
          '#003B73',
          '#0066B3',
          '#C8102E',
          '#FFD100',
          '#0F766E',
          '#475569',
        ],
        borderWidth: 1,
      },
    ],
  };

  const criticalItems = products.filter(
    (p) => p.status === 'stock_bajo' || p.status === 'agotado'
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Operativo y Acciones Directas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#C8102E]">
            Alcaldía Bolivariana de San Francisco · Dirección de Vivienda y Hábitat
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Panel de Control General de Inventario, Facturación y Prioridad Parroquial
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo en tiempo real de almacenes municipales, prioridad de atención en las 7 parroquias de San Francisco y emisión de facturas de entrada/salida.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('movimientos')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar Entrada / Salida y Factura
          </button>
          <button
            type="button"
            onClick={() => exportProductsToExcel(products)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Exportar Inventario (.XLSX)
          </button>
        </div>
      </div>

      {/* Franja de 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Valor Total en Almacén</span>
            <Package className="w-4 h-4 text-[#003B73]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ${metrics.totalInventoryValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>{metrics.totalProducts} rubros</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">{metrics.totalUnits.toLocaleString()} uds</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Parroquia Mayor Prioridad (#1)</span>
            <MapPin className="w-4 h-4 text-[#C8102E]" />
          </div>
          <div className="text-xl font-bold text-[#003B73] truncate">
            {topParish?.parish || 'Domitila Flores'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span className="font-mono font-semibold text-[#C8102E]">
              {topParish?.prioritySharePercent}% atención
            </span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">
              {topParish?.beneficiariesFamilies} familias
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Alertas de Stock Crítico</span>
            <AlertTriangle className="w-4 h-4 text-[#C8102E]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#C8102E]">
            {metrics.criticalAlertsCount}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>{metrics.lowStockCount} en stock bajo</span>
            <span aria-hidden="true"> · </span>
            <span>{metrics.outOfStockCount} agotados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Avance Físico (7 Parroquias)</span>
            <HardHat className="w-4 h-4 text-[#0066B3]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#003B73]">
            {metrics.avgPhysicalProgress}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>{metrics.activeProjects} obras activas</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">{metrics.totalBeneficiariesFamilies} familias</span>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Mapa de Prioridad por Parroquia del Municipio San Francisco (Estado Zulia) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-medium text-[#C8102E]">
              Territorialización Municipal · 7 Parroquias de San Francisco, Estado Zulia
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Prioridad de Atención por Parroquia (Despacho de Materiales, Obras y Familias)
            </h3>
            <p className="text-xs text-slate-500">
              Clasificación automática según el volumen de materiales despachados desde almacén, inversión ejecutada y familias atendidas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportParishPriorityToExcel(parishPriority)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Exportar Prioridad Parroquial (.XLSX)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tabla de Ranking de las 7 Parroquias */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-2.5">Prioridad</th>
                  <th className="py-2.5 px-2.5">Parroquia</th>
                  <th className="py-2.5 px-2.5 text-right">Familias</th>
                  <th className="py-2.5 px-2.5 text-right">Mat. Despachado</th>
                  <th className="py-2.5 px-2.5 text-right">Inversión Obras</th>
                  <th className="py-2.5 px-2.5 text-right">% Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parishPriority.map((item) => (
                  <tr key={item.parish} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2.5 font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          item.rank === 1
                            ? 'text-[#C8102E]'
                            : item.rank <= 3
                            ? 'text-[#003B73]'
                            : 'text-slate-600'
                        }
                      >
                        #{item.rank} · {item.priorityLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                      Parroquia {item.parish}
                      <div className="text-[11px] font-normal text-slate-500">
                        {item.projectsCount} obra(s) · {item.avgPhysicalProgress}% avance físico
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-800">
                      {item.beneficiariesFamilies.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-800">
                      <div>${item.dispatchedValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[11px] text-slate-500">{item.dispatchedUnits} uds</div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-semibold tabular-nums text-[#003B73]">
                      ${item.spentUsd.toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
                      <div>{item.prioritySharePercent}%</div>
                      <div className="w-16 ml-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            item.rank <= 3 ? 'bg-[#C8102E]' : 'bg-[#003B73]'
                          }`}
                          style={{ width: `${Math.min(100, item.prioritySharePercent * 3)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico Comparativo de las 7 Parroquias */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-800 mb-1">
              Inversión y Despacho de Materiales por Parroquia (USD)
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Distribución territorial en las 7 parroquias del Municipio San Francisco
            </p>
            <div className="h-64">
              <Bar
                data={parishChartData}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    x: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Analíticos de Stock y Valorización */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nivel de Stock Actual vs. Stock Mínimo de Seguridad
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de disponibilidad inmediata en almacenes municipales
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('productos')}
              className="text-xs font-semibold text-[#003B73] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver catálogo completo
            </button>
          </div>
          <div className="h-72">
            <Bar
              data={stockBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Valorización por Categoría (USD)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución financiera del inventario actual
            </p>
          </div>
          <div className="h-72 flex items-center justify-center">
            <Doughnut
              data={categoryDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo + Resumen de Avance de Obras */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alertas de Reposición Inmediata
              </h3>
              <p className="text-xs text-slate-500">
                Materiales por debajo del punto mínimo o agotados
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('movimientos')}
              className="text-xs font-semibold text-[#C8102E] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reponer stock
            </button>
          </div>

          {criticalItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Todos los materiales superan el stock mínimo requerido.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {criticalItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{item.code}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{item.warehouse}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-mono font-bold tabular-nums ${
                        item.status === 'agotado'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {item.stock} / {item.minStock} {item.unit}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.status === 'agotado' ? 'Agotado (Urgente)' : 'Stock Bajo'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado de Avances de Obras Habitacionales */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Avance de Obras y Proyectos Habitacionales
              </h3>
              <p className="text-xs text-slate-500">
                Ejecución física y familias atendidas por parroquia en San Francisco
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => exportProjectsToExcel(projects)}
                className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Exportar Excel
              </button>
              <button
                type="button"
                onClick={() => onNavigate('obras')}
                className="text-xs font-semibold text-[#003B73] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Gestionar obras
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {projects.slice(0, 4).map((prj) => (
              <div key={prj.id} className="pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {prj.name}
                  </div>
                  <div className="text-xs font-mono font-bold tabular-nums text-[#003B73] shrink-0">
                    {prj.physicalProgress}% físico
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  <span>Parroquia {prj.parish}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{prj.engineer}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">{prj.beneficiariesCount} familias</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      prj.physicalProgress >= 90
                        ? 'bg-emerald-600'
                        : prj.physicalProgress >= 50
                        ? 'bg-[#003B73]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${prj.physicalProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos Movimientos Registrados con Botón de Factura */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Actividad Reciente de Almacén y Emisión de Facturas (Kardex)
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en "Ver Factura" para imprimir o descargar el comprobante oficial de entrada o salida
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportMovementsToExcel(movements)}
            className="text-xs font-semibold text-[#003B73] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Exportar Kardex (.XLSX)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Nº Factura / Guía</th>
                <th className="py-2.5 px-3">Parroquia</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-right">Cantidad</th>
                <th className="py-2.5 px-3">Obra / Destino</th>
                <th className="py-2.5 px-3 text-right">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {movements.slice(0, 6).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {m.date}
                  </td>
                  <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {m.type === 'ENTRADA' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        ENTRADA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#C8102E]">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        SALIDA
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold whitespace-nowrap">
                    {m.referenceDoc}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#003B73] whitespace-nowrap">
                    {m.parish || 'San Francisco'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {m.productName}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {m.type === 'ENTRADA' ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{m.projectName}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(m)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#003B73] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver Factura
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
