import React, { useState } from 'react';
import { Printer, FileSpreadsheet, X, CheckCircle2, MapPin } from 'lucide-react';
import { Movement, Product } from '../types/inventory';
import { exportInvoiceToExcel } from '../utils/excelExport';

interface InvoiceModalProps {
  movement: Movement | null;
  products: Product[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  movement,
  products,
  onClose,
}) => {
  const [logoError, setLogoError] = useState(false);

  if (!movement) return null;

  const matchedProduct = products.find((p) => p.id === movement.productId);
  const unit = movement.unit || matchedProduct?.unit || 'Unidad';
  const unitCost = movement.unitCost ?? matchedProduct?.unitCost ?? 0;
  const warehouse =
    matchedProduct?.warehouse || 'Depósito Central Zona Industrial';
  const category = matchedProduct?.category || 'Materiales de Construcción';
  const subtotalUsd = Number((movement.quantity * unitCost).toFixed(2));
  const isEntry = movement.type === 'ENTRADA';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-xl overflow-hidden my-6">
        {/* Barra de Controles Superiores (No se imprime en papel) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#FFD100]" />
            <span id="invoice-modal-title">
              Comprobante y Factura Oficial de {isEntry ? 'Entrada a Almacén' : 'Salida / Despacho de Material'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportInvoiceToExcel(movement, matchedProduct)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-[#FFD100] hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Descargar Factura (.XLSX)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#003B73] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              aria-label="Cerrar factura"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo Imprimible de la Factura / Orden Institucional */}
        <div className="p-8 space-y-6 bg-white text-slate-900">
          {/* Franja Institucional */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FFD100] via-[#003B73] to-[#C8102E] rounded-full" />

          {/* Encabezado Membrete Oficial */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              {!logoError ? (
                <img
                  src="/assets/aistudio/471cce7e-210d-48d6-83c4-06056dedbbd1_b2bb86b0.jpg"
                  alt="Logo Alcaldía de San Francisco - Dirección de Vivienda y Hábitat"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-20 w-auto object-contain shrink-0"
                />
              ) : (
                <div className="font-bold text-lg text-[#003B73]">
                  SIVYH SAN FRANCISCO
                </div>
              )}
              <div>
                <div className="text-[11px] font-bold text-[#003B73] tracking-wider">
                  REPÚBLICA BOLIVARIANA DE VENEZUELA · ESTADO ZULIA
                </div>
                <div className="text-base font-bold text-slate-900">
                  ALCALDÍA BOLIVARIANA DE SAN FRANCISCO
                </div>
                <div className="text-xs font-bold text-[#C8102E]">
                  DIRECCIÓN DE VIVIENDA Y HÁBITAT · DIVISIÓN DE ALMACÉN
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  RIF: G-20000891-4 · Zona Industrial Sur II, San Francisco, Edo. Zulia
                </div>
              </div>
            </div>

            <div className="sm:text-right border border-slate-200 rounded-xl p-3.5 bg-slate-50 shrink-0">
              <div
                className={`text-[11px] font-bold tracking-wide ${
                  isEntry ? 'text-emerald-700' : 'text-[#C8102E]'
                }`}
              >
                {isEntry
                  ? 'FACTURA DE ENTRADA DE MATERIAL'
                  : 'FACTURA DE SALIDA / ORDEN DE DESPACHO'}
              </div>
              <div className="text-lg font-mono font-bold text-[#003B73] mt-0.5">
                Nº {movement.referenceDoc}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-1">
                Fecha: {movement.date} · ID: {movement.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Datos de Parroquia, Obra y Contraparte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">
                  {isEntry ? 'Proveedor / Empresa Suministradora:' : 'Beneficiario / Comunidad Receptora:'}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {movement.counterparty}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Obra o Proyecto Habitacional Asignado:</span>
                <div className="font-semibold text-[#003B73]">
                  {movement.projectName}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Almacén Municipal de Operación:</span>
                <div className="font-medium text-slate-800">{warehouse}</div>
              </div>
            </div>

            <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
                <span className="text-slate-500">Parroquia del Municipio San Francisco:</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                Parroquia {movement.parish || 'San Francisco'} (Edo. Zulia)
              </div>
              <div>
                <span className="text-slate-500">Funcionario Autorizador / Responsable:</span>
                <div className="font-semibold text-slate-800">
                  {movement.responsibleName}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Control de Auditoría Kardex:</span>
                <div className="font-mono text-slate-700">
                  Stock Anterior: {movement.previousStock} {unit} &rarr; Nuevo Saldo:{' '}
                  <strong>{movement.newStock} {unit}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Renglones de la Factura */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#003B73] text-white font-semibold">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Descripción del Material / Rubro</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-center">Unidad</th>
                  <th className="py-2.5 px-3 text-right">Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit. (USD)</th>
                  <th className="py-2.5 px-3 text-right">Total Valorizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-3 font-mono font-semibold text-[#003B73]">
                    {movement.productCode}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-900">
                    {movement.productName}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{category}</td>
                  <td className="py-3.5 px-3 text-center text-slate-700">{unit}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    {movement.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    ${unitCost.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    ${subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={5} className="py-3 px-3 text-xs text-slate-600">
                    <strong>Observaciones de Control:</strong>{' '}
                    {movement.notes || 'Material verificado físicamente en almacén sin novedades.'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-700">
                    TOTAL FACTURA:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm font-bold tabular-nums text-[#003B73]">
                    ${subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cuadro de Firmas y Sellos Oficiales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="border-t border-slate-400 pt-2 text-center">
              <div className="text-xs font-bold text-slate-900">
                ENTREGADO / REGISTRADO POR
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {movement.responsibleName}
              </div>
              <div className="text-[10px] text-slate-400">
                Coordinación de Almacén y Suministros
              </div>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <div className="text-xs font-bold text-slate-900">
                AUTORIZADO POR DIRECCIÓN
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Dirección de Vivienda y Hábitat
              </div>
              <div className="text-[10px] text-slate-400">
                Firma y Sello Húmedo Institucional
              </div>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <div className="text-xs font-bold text-slate-900">
                RECIBIDO CONFORME ({movement.parish})
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 truncate px-2">
                {movement.counterparty}
              </div>
              <div className="text-[10px] text-slate-400">
                Nombre, C.I., Firma y Huella
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Documento emitido por el Sistema SIVYH · Alcaldía Bolivariana de San Francisco
            </span>
            <span className="font-mono">
              Control Interno #{movement.referenceDoc}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
