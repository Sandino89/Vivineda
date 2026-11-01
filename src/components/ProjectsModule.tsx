import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Plus,
  FileSpreadsheet,
  Sliders,
  MapPin,
  Users,
  Calendar,
} from 'lucide-react';
import { ProjectWork, ProjectStatus } from '../types/inventory';
import { SAN_FRANCISCO_PARISHES } from '../data/seedData';
import { exportProjectsToExcel } from '../utils/excelExport';

interface ProjectsModuleProps {
  projects: ProjectWork[];
  canManageProjects: boolean;
  onSaveProject: (
    prj: Omit<ProjectWork, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  projects,
  canManageProjects,
  onSaveProject,
}) => {
  const [parishFilter, setParishFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [form, setForm] = useState({
    code: 'OBR-SF-2026-06',
    name: '',
    parish: 'San Francisco',
    sector: '',
    engineer: 'Ing. Mariangel Urdaneta',
    beneficiariesCount: 40,
    budgetUsd: 45000,
    spentUsd: 15000,
    physicalProgress: 35,
    financialProgress: 33,
    status: 'en_ejecucion' as ProjectStatus,
    startDate: '2026-10-15',
    targetDate: '2026-12-20',
    lastUpdateNote: '',
  });

  const filteredProjects = projects.filter((p) => {
    const matchParish = parishFilter === 'TODAS' || p.parish === parishFilter;
    const matchStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchParish && matchStatus;
  });

  const handleOpenNew = () => {
    setEditingId(undefined);
    setForm({
      code: `OBR-SF-2026-0${projects.length + 1}`,
      name: '',
      parish: 'San Francisco',
      sector: '',
      engineer: 'Ing. Mariangel Urdaneta',
      beneficiariesCount: 50,
      budgetUsd: 50000,
      spentUsd: 12500,
      physicalProgress: 25,
      financialProgress: 25,
      status: 'en_ejecucion',
      startDate: '2026-11-01',
      targetDate: '2027-01-30',
      lastUpdateNote: 'Inicio de replanteo y acopio de materiales en sitio.',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: ProjectWork) => {
    setEditingId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      parish: p.parish,
      sector: p.sector,
      engineer: p.engineer,
      beneficiariesCount: p.beneficiariesCount,
      budgetUsd: p.budgetUsd,
      spentUsd: p.spentUsd,
      physicalProgress: p.physicalProgress,
      financialProgress: p.financialProgress,
      status: p.status,
      startDate: p.startDate,
      targetDate: p.targetDate,
      lastUpdateNote: p.lastUpdateNote,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSaveProject(
      {
        ...form,
        beneficiariesCount: Number(form.beneficiariesCount),
        budgetUsd: Number(form.budgetUsd),
        spentUsd: Number(form.spentUsd),
        physicalProgress: Number(form.physicalProgress),
        financialProgress: Number(form.financialProgress),
      },
      editingId
    );
    setShowModal(false);
    Swal.fire({
      icon: 'success',
      title: editingId ? 'Avance de Obra Actualizado' : 'Nueva Obra Registrada',
      text: `${form.name} (${form.physicalProgress}% de avance físico).`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Obras y Controles */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#C8102E]">
            Dirección de Vivienda y Hábitat · Control de Ejecución en las 7 Parroquias
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Reporte de Avances de Obras y Proyectos Habitacionales
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seguimiento físico, financiero, familias beneficiadas y bitácora de inspección técnica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            aria-label="Filtrar obras por parroquia"
            value={parishFilter}
            onChange={(e) => setParishFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="TODAS">Todas las Parroquias (7)</option>
            {SAN_FRANCISCO_PARISHES.map((par) => (
              <option key={par} value={par}>
                Parroquia {par}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar obras por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="planificado">Planificado</option>
            <option value="pausado">Pausado</option>
            <option value="culminado">Culminado</option>
          </select>

          {canManageProjects && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Nueva Obra
            </button>
          )}

          <button
            type="button"
            onClick={() => exportProjectsToExcel(filteredProjects)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Exportar Avances (.XLSX)
          </button>
        </div>
      </div>

      {/* Listado de Obras y Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-[#003B73] font-semibold">
                    {p.code} · {p.status === 'culminado' ? 'Obra Culminada' : p.status === 'en_ejecucion' ? 'En Ejecución' : 'En Planificación'}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {p.name}
                  </h3>
                </div>
                {canManageProjects && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#003B73] bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Actualizar Avance
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
                  Parroquia {p.parish} ({p.sector})
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#003B73]" />
                  <strong className="font-mono tabular-nums text-slate-800">{p.beneficiariesCount}</strong> familias
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Meta: {p.targetDate}
                </span>
              </div>

              {/* Barras de Avance Físico y Financiero */}
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Avance Físico de Obra</span>
                    <span className="font-mono font-bold tabular-nums text-[#003B73]">
                      {p.physicalProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003B73] rounded-full transition-all"
                      style={{ width: `${p.physicalProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      Ejecución Financiera (${p.spentUsd.toLocaleString()} / ${p.budgetUsd.toLocaleString()} USD)
                    </span>
                    <span className="font-mono font-bold tabular-nums text-emerald-700">
                      {p.financialProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${p.financialProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 mb-0.5">
                Inspector Residente: {p.engineer}
              </div>
              <p className="text-slate-500 leading-relaxed">{p.lastUpdateNote}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Registro / Actualización de Avance de Obra */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-project-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="modal-project-title" className="text-base font-bold text-slate-900">
                {editingId ? 'Actualizar Reporte de Avance de Obra' : 'Registrar Nueva Obra Habitacional'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prj-code" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Obra
                  </label>
                  <input
                    id="prj-code"
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="prj-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de la Obra / Proyecto
                  </label>
                  <input
                    id="prj-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Rehabilitación de Techos Urb. La Popular"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prj-parish" className="block text-xs font-semibold text-slate-700 mb-1">
                    Parroquia
                  </label>
                  <select
                    id="prj-parish"
                    value={form.parish}
                    onChange={(e) => setForm({ ...form, parish: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {SAN_FRANCISCO_PARISHES.map((par) => (
                      <option key={par} value={par}>
                        {par}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prj-sector" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sector / Comunidad
                  </label>
                  <input
                    id="prj-sector"
                    type="text"
                    required
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prj-eng" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ingeniero Inspector
                  </label>
                  <input
                    id="prj-eng"
                    type="text"
                    required
                    value={form.engineer}
                    onChange={(e) => setForm({ ...form, engineer: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="prj-phys" className="block text-xs font-semibold text-slate-700 mb-1">
                    Avance Físico (%)
                  </label>
                  <input
                    id="prj-phys"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={form.physicalProgress}
                    onChange={(e) => setForm({ ...form, physicalProgress: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prj-fin" className="block text-xs font-semibold text-slate-700 mb-1">
                    Avance Financiero (%)
                  </label>
                  <input
                    id="prj-fin"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={form.financialProgress}
                    onChange={(e) => setForm({ ...form, financialProgress: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prj-ben" className="block text-xs font-semibold text-slate-700 mb-1">
                    Familias Beneficiadas
                  </label>
                  <input
                    id="prj-ben"
                    type="number"
                    min={1}
                    required
                    value={form.beneficiariesCount}
                    onChange={(e) => setForm({ ...form, beneficiariesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prj-status" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado de Obra
                  </label>
                  <select
                    id="prj-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="en_ejecucion">En Ejecución</option>
                    <option value="planificado">Planificado</option>
                    <option value="pausado">Pausado</option>
                    <option value="culminado">Culminado</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prj-note" className="block text-xs font-semibold text-slate-700 mb-1">
                  Informe Técnico de Inspección / Hitos Recientes
                </label>
                <textarea
                  id="prj-note"
                  rows={3}
                  required
                  value={form.lastUpdateNote}
                  onChange={(e) => setForm({ ...form, lastUpdateNote: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
                >
                  Guardar Avance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
