import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  FileText,
  Printer,
} from 'lucide-react';
import {
  Product,
  Movement,
  MovementType,
  ProjectWork,
  Supplier,
  Beneficiary,
} from '../types/inventory';
import { filterMovements } from '../utils/inventoryLogic';
import { SAN_FRANCISCO_PARISHES } from '../data/seedData';
import { exportMovementsToExcel } from '../utils/excelExport';

interface MovementsModuleProps {
  products: Product[];
  movements: Movement[];
  projects: ProjectWork[];
  suppliers: Supplier[];
  beneficiaries: Beneficiary[];
  currentUserName: string;
  canRegister: boolean;
  onRegisterMovement: (payload: {
    type: MovementType;
    productId: string;
    quantity: number;
    referenceDoc: string;
    parish: string;
    projectName: string;
    counterparty: string;
    responsibleName: string;
    notes: string;
    date: string;
  }) => { ok: boolean; movement?: Movement; error?: string };
  onSelectInvoice: (movement: Movement) => void;
}

export const MovementsModule: React.FC<MovementsModuleProps> = ({
  products,
  movements,
  projects,
  suppliers,
  beneficiaries,
  currentUserName,
  canRegister,
  onRegisterMovement,
  onSelectInvoice,
}) => {
  const [type, setType] = useState<MovementType>('SALIDA');
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceDoc, setReferenceDoc] = useState<string>('FAC-SAL-2026-1205');
  const [parish, setParish] = useState<string>('José Domingo Rus');
  const [projectName, setProjectName] = useState<string>(
    projects[0]?.name || 'Plan Techo Seguro Urb. El Soler'
  );
  const [counterparty, setCounterparty] = useState<string>(
    beneficiaries[0]?.name || 'Consejo Comunal Luchadores de El Soler'
  );
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('2026-11-01');

  // Filtros del Historial Kardex
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [projectFilter, setProjectFilter] = useState('TODOS');
  const [parishFilter, setParishFilter] = useState('TODAS');

  const selectedProduct = products.find((p) => p.id === productId);
  const estimatedTotalUsd = selectedProduct
    ? Number((quantity * selectedProduct.unitCost).toFixed(2))
    : 0;

  const handleProjectChange = (selectedProjName: string) => {
    setProjectName(selectedProjName);
    const matchedProj = projects.find((pr) => pr.name === selectedProjName);
    if (matchedProj) {
      setParish(matchedProj.parish);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onRegisterMovement({
      type,
      productId,
      quantity: Number(quantity),
      referenceDoc: referenceDoc.trim() || 'FAC-S/N',
      parish,
      projectName,
      counterparty,
      responsibleName: currentUserName,
      notes: notes.trim(),
      date,
    });

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo procesar el movimiento',
        text: res.error || 'Verifica la cantidad disponible.',
        confirmButtonColor: '#C8102E',
      });
      return;
    }

    setNotes('');
    setReferenceDoc(
      `FAC-${type === 'ENTRADA' ? 'ENT' : 'SAL'}-2026-${Math.floor(1210 + Math.random() * 790)}`
    );

    if (res.movement) {
      onSelectInvoice(res.movement);
    }
  };

  const filteredMovements = filterMovements(
    movements,
    searchQuery,
    typeFilter,
    projectFilter,
    parishFilter
  );

  return (
    <div className="space-y-6">
      {/* Formulario de Registro de Entrada / Salida y Emisión de Factura */}
      {canRegister && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-5 border-b border-slate-200">
            <div>
              <div className="text-xs font-medium text-[#C8102E]">
                Control de Almacén y Facturación Institucional · Municipio San Francisco
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Registrar Entrada / Salida y Generar Factura de Material
              </h2>
              <p className="text-xs text-slate-500">
                Al procesar la operación se actualiza el stock en tiempo real y se genera automáticamente la Factura Oficial imprimible.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => {
                  setType('ENTRADA');
                  setReferenceDoc('FAC-ENT-2026-0950');
                  setCounterparty(suppliers[0]?.name || 'Proveedor General');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Factura de Entrada
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('SALIDA');
                  setReferenceDoc('FAC-SAL-2026-1205');
                  setCounterparty(beneficiaries[0]?.name || 'Beneficiario / Obra');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  type === 'SALIDA'
                    ? 'bg-[#C8102E] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Factura de Salida / Despacho
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label htmlFor="mov-product" className="block text-xs font-semibold text-slate-700 mb-1">
                Material / Producto ({selectedProduct ? `Disp: ${selectedProduct.stock} ${selectedProduct.unit} · $${selectedProduct.unitCost.toFixed(2)}` : ''})
              </label>
              <select
                id="mov-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} — (Disp: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="mov-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                Cantidad ({selectedProduct?.unit || 'Uds'})
              </label>
              <input
                id="mov-qty"
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="mov-doc" className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Control de Factura / Guía
              </label>
              <input
                id="mov-doc"
                type="text"
                required
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="mov-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Factura
              </label>
              <input
                id="mov-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="mov-parish" className="block text-xs font-semibold text-slate-700 mb-1">
                Parroquia de San Francisco (Edo. Zulia)
              </label>
              <select
                id="mov-parish"
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-[#003B73] border border-slate-300 rounded-lg bg-white"
              >
                {SAN_FRANCISCO_PARISHES.map((par) => (
                  <option key={par} value={par}>
                    Parroquia {par}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="mov-project" className="block text-xs font-semibold text-slate-700 mb-1">
                Obra o Proyecto Asociado
              </label>
              <select
                id="mov-project"
                value={projectName}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Stock General de Almacén">Stock General de Almacén</option>
                {projects.map((pr) => (
                  <option key={pr.id} value={pr.name}>
                    {pr.name} ({pr.parish})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="mov-counterparty" className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'ENTRADA' ? 'Proveedor que Entrega' : 'Beneficiario / Comunidad Receptora'}
              </label>
              <select
                id="mov-counterparty"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {type === 'ENTRADA'
                  ? suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))
                  : beneficiaries.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.parish})
                      </option>
                    ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="mov-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones de Control / Transporte
              </label>
              <input
                id="mov-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Placa camión, C.I. receptor..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Monto Total Valorizado de la Factura:{' '}
                <strong className="font-mono text-sm text-[#003B73]">
                  ${estimatedTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </strong>{' '}
                · Destino: <strong>Parroquia {parish}</strong>
              </div>
              <button
                type="submit"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-[#003B73] hover:bg-[#002850]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Procesar {type === 'ENTRADA' ? 'Entrada' : 'Salida'} y Emitir Factura
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de Movimientos Kardex y Facturación */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Historial General de Movimientos y Facturas Emitidas (Kardex)
            </h3>
            <p className="text-xs text-slate-500">
              Filtra por cualquiera de las 7 parroquias de San Francisco y genera la factura oficial de entrada o salida
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportMovementsToExcel(filteredMovements)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Exportar Kardex a Excel (.XLSX)
          </button>
        </div>

        {/* Filtros del Kardex incluyendo Parroquia */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              aria-label="Buscar en historial de movimientos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nº factura, código, material, parroquia..."
              className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-3">
            <select
              aria-label="Filtrar movimientos por parroquia"
              value={parishFilter}
              onChange={(e) => setParishFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="TODAS">Todas las Parroquias (7)</option>
              {SAN_FRANCISCO_PARISHES.map((par) => (
                <option key={par} value={par}>
                  Parroquia {par}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              aria-label="Filtrar por tipo de movimiento"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="TODOS">Entradas y Salidas</option>
              <option value="ENTRADA">Solo Entradas (+)</option>
              <option value="SALIDA">Solo Salidas (-)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              aria-label="Filtrar por obra asignada"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="TODOS">Todas las obras</option>
              <option value="Stock General de Almacén">Stock General de Almacén</option>
              {projects.map((pr) => (
                <option key={pr.id} value={pr.name}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 px-2.5">Fecha</th>
                <th className="py-3 px-2.5">Tipo</th>
                <th className="py-3 px-2.5">Nº Factura</th>
                <th className="py-3 px-2.5">Parroquia</th>
                <th className="py-3 px-2.5">Material</th>
                <th className="py-3 px-2.5 text-right">Cantidad</th>
                <th className="py-3 px-2.5 text-right">Saldo Ant. &rarr; Nuevo</th>
                <th className="py-3 px-2.5">Obra · Destinatario/Proveedor</th>
                <th className="py-3 px-2.5 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {m.date}
                  </td>
                  <td className="py-3 px-2.5 font-semibold whitespace-nowrap">
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
                  <td className="py-3 px-2.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                    {m.referenceDoc}
                  </td>
                  <td className="py-3 px-2.5 font-semibold text-[#003B73] whitespace-nowrap">
                    {m.parish || 'San Francisco'}
                  </td>
                  <td className="py-3 px-2.5">
                    <div className="font-semibold text-slate-900">{m.productName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{m.productCode}</div>
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
                    {m.type === 'ENTRADA' ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {m.previousStock} &rarr; <strong className="text-slate-900">{m.newStock}</strong>
                  </td>
                  <td className="py-3 px-2.5">
                    <div className="font-medium text-slate-800">{m.projectName}</div>
                    <div className="text-[11px] text-slate-500">{m.counterparty}</div>
                  </td>
                  <td className="py-3 px-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Generar Factura
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
