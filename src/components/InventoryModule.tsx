import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Package,
  Tags,
  Truck,
  Users,
} from 'lucide-react';
import {
  Product,
  Category,
  Supplier,
  Beneficiary,
} from '../types/inventory';
import { computeStockStatus, filterProducts } from '../utils/inventoryLogic';
import { exportProductsToExcel } from '../utils/excelExport';
import { SAN_FRANCISCO_PARISHES } from '../data/seedData';

interface InventoryModuleProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  beneficiaries: Beneficiary[];
  canManage: boolean;
  canDelete: boolean;
  onSaveProduct: (product: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  onDeleteProduct: (id: string) => void;
  onSaveCategory: (cat: Omit<Category, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteCategory: (id: string) => void;
  onSaveSupplier: (sup: Omit<Supplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteSupplier: (id: string) => void;
  onSaveBeneficiary: (ben: Omit<Beneficiary, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteBeneficiary: (id: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  categories,
  suppliers,
  beneficiaries,
  canManage,
  canDelete,
  onSaveProduct,
  onDeleteProduct,
  onSaveCategory,
  onDeleteCategory,
  onSaveSupplier,
  onDeleteSupplier,
  onSaveBeneficiary,
  onDeleteBeneficiary,
}) => {
  const [subTab, setSubTab] = useState<'productos' | 'categorias' | 'proveedores' | 'beneficiarios'>('productos');

  // Filtros de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [warehouseFilter, setWarehouseFilter] = useState('TODOS');

  // Formulario Modal de Producto
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [prodForm, setProdForm] = useState({
    code: 'MAT-NUE-009',
    name: '',
    category: categories[0]?.name || 'Cementos y Agregados',
    unit: 'Unidad',
    stock: 50,
    minStock: 20,
    unitCost: 10,
    warehouse: 'Depósito Central Zona Industrial',
    supplierName: suppliers[0]?.name || 'Corporación Zuliana de Cementos y Agregados C.A.',
  });

  // Formulario Categoría
  const [catForm, setCatForm] = useState({ code: '', name: '', description: '' });
  // Formulario Proveedor
  const [supForm, setSupForm] = useState({
    rif: '',
    name: '',
    contactName: '',
    phone: '',
    address: '',
    specialty: 'Cementos y Agregados',
  });
  // Formulario Beneficiario / Cliente
  const [benForm, setBenForm] = useState({
    cedulaRif: '',
    name: '',
    parish: 'San Francisco',
    sector: '',
    phone: '',
    projectAssigned: 'Plan Techo Seguro Urb. El Soler',
  });

  const filteredProducts = filterProducts(
    products,
    searchQuery,
    categoryFilter,
    statusFilter,
    warehouseFilter
  );

  const warehouses = Array.from(new Set(products.map((p) => p.warehouse)));

  const handleOpenNewProduct = () => {
    setEditingProductId(undefined);
    setProdForm({
      code: `MAT-${String(products.length + 1).padStart(3, '0')}`,
      name: '',
      category: categories[0]?.name || 'Cementos y Agregados',
      unit: 'Saco',
      stock: 100,
      minStock: 25,
      unitCost: 12.5,
      warehouse: 'Depósito Central Zona Industrial',
      supplierName: suppliers[0]?.name || 'Corporación Zuliana de Cementos y Agregados C.A.',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdForm({
      code: p.code,
      name: p.name,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      unitCost: p.unitCost,
      warehouse: p.warehouse,
      supplierName: p.supplierName,
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.code.trim()) return;
    const status = computeStockStatus(Number(prodForm.stock), Number(prodForm.minStock));
    onSaveProduct(
      {
        code: prodForm.code.trim(),
        name: prodForm.name.trim(),
        category: prodForm.category,
        unit: prodForm.unit.trim(),
        stock: Number(prodForm.stock),
        minStock: Number(prodForm.minStock),
        unitCost: Number(prodForm.unitCost),
        warehouse: prodForm.warehouse.trim(),
        supplierName: prodForm.supplierName,
        status,
      },
      editingProductId
    );
    setShowProductModal(false);
    Swal.fire({
      icon: 'success',
      title: editingProductId ? 'Material actualizado' : 'Material registrado',
      text: `${prodForm.name} guardado en el inventario municipal.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.code.trim() || !catForm.name.trim()) return;
    onSaveCategory({
      code: catForm.code.trim().toUpperCase(),
      name: catForm.name.trim(),
      description: catForm.description.trim() || 'Categoría de materiales de construcción',
    });
    setCatForm({ code: '', name: '', description: '' });
    Swal.fire({
      icon: 'success',
      title: 'Categoría agregada',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.rif.trim() || !supForm.name.trim()) return;
    onSaveSupplier({
      rif: supForm.rif.trim().toUpperCase(),
      name: supForm.name.trim(),
      contactName: supForm.contactName.trim() || 'Representante Comercial',
      phone: supForm.phone.trim() || '0414-0000000',
      address: supForm.address.trim() || 'Municipio San Francisco, Edo. Zulia',
      specialty: supForm.specialty.trim(),
    });
    setSupForm({
      rif: '',
      name: '',
      contactName: '',
      phone: '',
      address: '',
      specialty: 'Cementos y Agregados',
    });
    Swal.fire({
      icon: 'success',
      title: 'Proveedor registrado',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!benForm.cedulaRif.trim() || !benForm.name.trim()) return;
    onSaveBeneficiary({
      cedulaRif: benForm.cedulaRif.trim().toUpperCase(),
      name: benForm.name.trim(),
      parish: benForm.parish,
      sector: benForm.sector.trim() || 'Sector Urbano San Francisco',
      phone: benForm.phone.trim() || '0414-0000000',
      projectAssigned: benForm.projectAssigned.trim(),
    });
    setBenForm({
      cedulaRif: '',
      name: '',
      parish: 'San Francisco',
      sector: '',
      phone: '',
      projectAssigned: 'Plan Techo Seguro Urb. El Soler',
    });
    Swal.fire({
      icon: 'success',
      title: 'Beneficiario / Cliente registrado',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Navegación Interna de Catálogos */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('productos')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'productos'
                ? 'bg-white text-[#003B73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Productos y Materiales ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('categorias')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'categorias'
                ? 'bg-white text-[#003B73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            Categorías ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('proveedores')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'proveedores'
                ? 'bg-white text-[#003B73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Proveedores ({suppliers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('beneficiarios')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'beneficiarios'
                ? 'bg-white text-[#003B73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clientes y Beneficiarios ({beneficiaries.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {subTab === 'productos' && canManage && (
            <button
              type="button"
              onClick={handleOpenNewProduct}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Material
            </button>
          )}
          <button
            type="button"
            onClick={() => exportProductsToExcel(filteredProducts)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* VISTA 1: PRODUCTOS / MATERIALES */}
      {subTab === 'productos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          {/* Barra de Búsqueda Avanzada y Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                aria-label="Buscar material por código, nombre o proveedor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código, material, categoría o proveedor..."
                className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B73]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filtrar por categoría"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"
              >
                <option value="TODAS">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filtrar por estado de stock"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="stock_bajo">Stock Bajo</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filtrar por almacén"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"
              >
                <option value="TODOS">Todos los almacenes</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Inventario */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Material / Producto</th>
                  <th className="py-3 px-3">Categoría · Almacén</th>
                  <th className="py-3 px-3 text-right">Stock Actual</th>
                  <th className="py-3 px-3 text-right">Mínimo</th>
                  <th className="py-3 px-3 text-right">Costo Unit.</th>
                  <th className="py-3 px-3 text-right">Valor Total</th>
                  <th className="py-3 px-3">Estado</th>
                  {canManage && <th className="py-3 px-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-semibold text-[#003B73]">
                      {p.code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.supplierName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span>{p.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-slate-500">{p.warehouse}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                      {p.stock.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                      {p.minStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      ${p.unitCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                      ${(p.stock * p.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {p.status === 'disponible' && (
                        <span className="text-emerald-700">Disponible</span>
                      )}
                      {p.status === 'stock_bajo' && (
                        <span className="text-amber-700 font-semibold">Stock Bajo</span>
                      )}
                      {p.status === 'agotado' && (
                        <span className="text-[#C8102E] font-bold">Agotado</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          aria-label={`Editar ${p.name}`}
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-slate-600 hover:text-[#003B73] rounded cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            aria-label={`Eliminar ${p.name}`}
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-600 hover:text-[#C8102E] rounded cursor-pointer ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No se encontraron materiales con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: CATEGORÍAS */}
      {subTab === 'categorias' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {canManage && (
            <form
              onSubmit={handleCategorySubmit}
              className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 h-fit"
            >
              <h3 className="text-base font-bold text-slate-900">
                Registrar Nueva Categoría
              </h3>
              <div>
                <label htmlFor="cat-code" className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Categoría
                </label>
                <input
                  id="cat-code"
                  type="text"
                  required
                  value={catForm.code}
                  onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                  placeholder="Ej. CAT-HER"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Ej. Herramientas y Equipos Menores"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción Técnica
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Descripción de los rubros incluidos..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
              >
                Guardar Categoría
              </button>
            </form>
          )}

          <div className={`${canManage ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-6`}>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Catálogo Oficial de Categorías
            </h3>
            <div className="divide-y divide-slate-200">
              {categories.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      <span className="font-mono text-[#003B73] mr-2">{c.code}</span>
                      {c.name}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Eliminar categoría ${c.name}`}
                      onClick={() => onDeleteCategory(c.id)}
                      className="p-1.5 text-slate-400 hover:text-[#C8102E] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: PROVEEDORES */}
      {subTab === 'proveedores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {canManage && (
            <form
              onSubmit={handleSupplierSubmit}
              className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5 h-fit"
            >
              <h3 className="text-base font-bold text-slate-900">
                Registrar Proveedor / Contratista
              </h3>
              <div>
                <label htmlFor="sup-rif" className="block text-xs font-semibold text-slate-700 mb-1">
                  RIF Fiscal
                </label>
                <input
                  id="sup-rif"
                  type="text"
                  required
                  value={supForm.rif}
                  onChange={(e) => setSupForm({ ...supForm, rif: e.target.value })}
                  placeholder="J-30123456-7"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sup-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Razón Social
                </label>
                <input
                  id="sup-name"
                  type="text"
                  required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="Suministros Zulianos C.A."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sup-contact" className="block text-xs font-semibold text-slate-700 mb-1">
                    Persona Contacto
                  </label>
                  <input
                    id="sup-contact"
                    type="text"
                    value={supForm.contactName}
                    onChange={(e) => setSupForm({ ...supForm, contactName: e.target.value })}
                    placeholder="Ing. Pedro Pérez"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sup-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="sup-phone"
                    type="text"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    placeholder="0414-6000000"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sup-address" className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Fiscal en Zulia
                </label>
                <input
                  id="sup-address"
                  type="text"
                  value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  placeholder="Zona Industrial Sur, San Francisco"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
              >
                Guardar Proveedor
              </button>
            </form>
          )}

          <div className={`${canManage ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-6`}>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Directorio de Proveedores de la Dirección de Vivienda
            </h3>
            <div className="divide-y divide-slate-200">
              {suppliers.map((s) => (
                <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      <span className="font-mono text-[#003B73] mr-2">{s.rif}</span>
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>Contacto: {s.contactName}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono">{s.phone}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{s.address}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Eliminar proveedor ${s.name}`}
                      onClick={() => onDeleteSupplier(s.id)}
                      className="p-1.5 text-slate-400 hover:text-[#C8102E] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: CLIENTES / BENEFICIARIOS Y CONSEJOS COMUNALES */}
      {subTab === 'beneficiarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {canManage && (
            <form
              onSubmit={handleBeneficiarySubmit}
              className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5 h-fit"
            >
              <h3 className="text-base font-bold text-slate-900">
                Registrar Cliente / Beneficiario / Comunidad
              </h3>
              <div>
                <label htmlFor="ben-id" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cédula o RIF del Consejo Comunal
                </label>
                <input
                  id="ben-id"
                  type="text"
                  required
                  value={benForm.cedulaRif}
                  onChange={(e) => setBenForm({ ...benForm, cedulaRif: e.target.value })}
                  placeholder="V-15234890 o C.C.J-3019283-1"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="ben-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Familia o Consejo Comunal
                </label>
                <input
                  id="ben-name"
                  type="text"
                  required
                  value={benForm.name}
                  onChange={(e) => setBenForm({ ...benForm, name: e.target.value })}
                  placeholder="Consejo Comunal Unido por San Francisco"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="ben-parish" className="block text-xs font-semibold text-slate-700 mb-1">
                  Parroquia del Municipio San Francisco
                </label>
                <select
                  id="ben-parish"
                  value={benForm.parish}
                  onChange={(e) => setBenForm({ ...benForm, parish: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {SAN_FRANCISCO_PARISHES.map((par) => (
                    <option key={par} value={par}>
                      Parroquia {par}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ben-sector" className="block text-xs font-semibold text-slate-700 mb-1">
                  Barrio / Urbanización / Sector
                </label>
                <input
                  id="ben-sector"
                  type="text"
                  value={benForm.sector}
                  onChange={(e) => setBenForm({ ...benForm, sector: e.target.value })}
                  placeholder="Urb. La Coromoto, Vereda 8"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="ben-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  id="ben-phone"
                  type="text"
                  value={benForm.phone}
                  onChange={(e) => setBenForm({ ...benForm, phone: e.target.value })}
                  placeholder="0414-6001122"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
              >
                Guardar Beneficiario
              </button>
            </form>
          )}

          <div className={`${canManage ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-6`}>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Padrón de Beneficiarios y Consejos Comunales Atendidos
            </h3>
            <div className="divide-y divide-slate-200">
              {beneficiaries.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      <span className="font-mono text-[#003B73] mr-2">{b.cedulaRif}</span>
                      {b.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>Parroquia {b.parish}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{b.sector}</span>
                      <span aria-hidden="true"> · </span>
                      <span>Obra: {b.projectAssigned}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Eliminar beneficiario ${b.name}`}
                      onClick={() => onDeleteBeneficiary(b.id)}
                      className="p-1.5 text-slate-400 hover:text-[#C8102E] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {showProductModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="modal-product-title" className="text-base font-bold text-slate-900">
                {editingProductId ? 'Editar Material de Inventario' : 'Registrar Nuevo Material'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prd-code" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código
                  </label>
                  <input
                    id="prd-code"
                    type="text"
                    required
                    value={prodForm.code}
                    onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="prd-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Material / Producto
                  </label>
                  <input
                    id="prd-name"
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Ej. Saco de Cemento Gris 42.5kg"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prd-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id="prd-cat"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prd-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    id="prd-unit"
                    type="text"
                    required
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    placeholder="Saco, Lámina, Unidad, Rollo..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prd-stock" className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Inicial / Actual
                  </label>
                  <input
                    id="prd-stock"
                    type="number"
                    min={0}
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prd-min" className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Mínimo Alerta
                  </label>
                  <input
                    id="prd-min"
                    type="number"
                    min={0}
                    required
                    value={prodForm.minStock}
                    onChange={(e) => setProdForm({ ...prodForm, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prd-cost" className="block text-xs font-semibold text-slate-700 mb-1">
                    Costo Unit. (USD)
                  </label>
                  <input
                    id="prd-cost"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={prodForm.unitCost}
                    onChange={(e) => setProdForm({ ...prodForm, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prd-warehouse" className="block text-xs font-semibold text-slate-700 mb-1">
                    Almacén / Depósito Municipal
                  </label>
                  <input
                    id="prd-warehouse"
                    type="text"
                    required
                    value={prodForm.warehouse}
                    onChange={(e) => setProdForm({ ...prodForm, warehouse: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="prd-supplier" className="block text-xs font-semibold text-slate-700 mb-1">
                    Proveedor Principal
                  </label>
                  <select
                    id="prd-supplier"
                    value={prodForm.supplierName}
                    onChange={(e) => setProdForm({ ...prodForm, supplierName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
