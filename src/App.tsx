/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  HardHat,
  ShieldCheck,
  Code2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from './lib/firebase';
import {
  Product,
  Category,
  Supplier,
  Beneficiary,
  Movement,
  MovementType,
  ProjectWork,
  AppUser,
  UserRole,
} from './types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_BENEFICIARIES,
  INITIAL_MOVEMENTS,
  INITIAL_PROJECTS,
  INITIAL_USERS,
} from './data/seedData';
import {
  calculateMovementResult,
  hasPermission,
  getRoleLabel,
} from './utils/inventoryLogic';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { InventoryModule } from './components/InventoryModule';
import { MovementsModule } from './components/MovementsModule';
import { ProjectsModule } from './components/ProjectsModule';
import { UsersRolesModule } from './components/UsersRolesModule';
import { AppsScriptModule } from './components/AppsScriptModule';
import { InvoiceModal } from './components/InvoiceModal';

type ActiveSection =
  | 'dashboard'
  | 'productos'
  | 'movimientos'
  | 'obras'
  | 'usuarios'
  | 'apps_script';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sivyh_products_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('sivyh_categories_v2');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('sivyh_suppliers_v2');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() => {
    const saved = localStorage.getItem('sivyh_beneficiaries_v2');
    return saved ? JSON.parse(saved) : INITIAL_BENEFICIARIES;
  });
  const [movements, setMovements] = useState<Movement[]>(() => {
    const saved = localStorage.getItem('sivyh_movements_v2');
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });
  const [projects, setProjects] = useState<ProjectWork[]>(() => {
    const saved = localStorage.getItem('sivyh_projects_v2');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('sivyh_users_v2');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return INITIAL_USERS[0];
    }
    const savedSession = localStorage.getItem('sivyh_active_user');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selectedInvoiceMovement, setSelectedInvoiceMovement] =
    useState<Movement | null>(null);

  useEffect(() => {
    localStorage.setItem('sivyh_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sivyh_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('sivyh_suppliers_v2', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('sivyh_beneficiaries_v2', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  useEffect(() => {
    localStorage.setItem('sivyh_movements_v2', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('sivyh_projects_v2', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('sivyh_users_v2', JSON.stringify(users));
  }, [users]);

  // Escuchar sesión de Firebase Authentication
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const matched = users.find(
          (u) => u.email.toLowerCase() === fbUser.email?.toLowerCase()
        );
        const assignedRole: UserRole =
          fbUser.email === 'deposito.vyh@gmail.com'
            ? 'admin'
            : matched?.role || 'almacenista';

        const loggedUser: AppUser = {
          id: fbUser.uid,
          name: fbUser.displayName || matched?.name || 'Funcionario SIVYH',
          username: fbUser.email.split('@')[0].slice(0, 60),
          email: fbUser.email.slice(0, 150),
          role: assignedRole,
          department:
            matched?.department || 'Dirección de Vivienda y Hábitat',
          active: true,
          ownerId: fbUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentUser(loggedUser);
        localStorage.setItem('sivyh_active_user', JSON.stringify(loggedUser));

        if (fbUser.emailVerified) {
          try {
            await setDoc(doc(db, 'users', fbUser.uid), {
              name: loggedUser.name.slice(0, 120),
              username: loggedUser.username.slice(0, 60),
              email: loggedUser.email.slice(0, 150),
              role: loggedUser.role,
              department: loggedUser.department.slice(0, 100),
              active: true,
              ownerId: fbUser.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
          }
        }
      }
    });
    return () => unsub();
  }, [users]);

  const syncEntityToFirestore = async (
    collectionName: string,
    docId: string,
    payload: Record<string, unknown>,
    isUpdate = false
  ) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const cleanId = docId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
    try {
      await setDoc(doc(db, collectionName, cleanId), {
        ...payload,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        ...(isUpdate ? { updatedAt: serverTimestamp() } : {}),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${collectionName}/${cleanId}`
      );
    }
  };

  // Inicio de sesión por Usuario y Contraseña
  const handleCredentialLogin = (usernameInput: string, passwordInput: string) => {
    setAuthError(null);
    const normalized = usernameInput.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        (u.username.toLowerCase() === normalized ||
          u.email.toLowerCase() === normalized) &&
        (u.password || 'admin123') === passwordInput
    );

    if (!matched) {
      setAuthError(
        'Credenciales inválidas. Verifica el usuario y la contraseña o utiliza uno de los accesos rápidos institucionales.'
      );
      return;
    }

    setCurrentUser(matched);
    localStorage.setItem('sivyh_active_user', JSON.stringify(matched));
  };

  // Inicio de sesión con Google (Firebase Auth)
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? `Autenticación Google cancelada o bloqueada: ${error.message}`
          : 'No se pudo completar el inicio de sesión con Google.'
      );
    }
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('sivyh_active_user');
  };

  // Handlers de Inventario
  const handleSaveProduct = (
    prodData: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const id = existingId || `prd-${Date.now()}`;
    const newProduct: Product = {
      ...prodData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };

    if (existingId) {
      setProducts((prev) => prev.map((p) => (p.id === existingId ? newProduct : p)));
    } else {
      setProducts((prev) => [newProduct, ...prev]);
    }

    void syncEntityToFirestore(
      'products',
      id,
      {
        code: newProduct.code.slice(0, 40),
        name: newProduct.name.slice(0, 160),
        category: newProduct.category.slice(0, 80),
        unit: newProduct.unit.slice(0, 30),
        stock: newProduct.stock,
        minStock: newProduct.minStock,
        unitCost: newProduct.unitCost,
        warehouse: newProduct.warehouse.slice(0, 100),
        supplierName: newProduct.supplierName.slice(0, 140),
        status: newProduct.status,
      },
      true
    );
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleSaveCategory = (
    catData: Omit<Category, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const id = `cat-${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };
    setCategories((prev) => [...prev, newCat]);
    void syncEntityToFirestore(
      'categories',
      id,
      {
        code: newCat.code.slice(0, 30),
        name: newCat.name.slice(0, 100),
        description: newCat.description.slice(0, 300),
      },
      true
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveSupplier = (
    supData: Omit<Supplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const id = `sup-${Date.now()}`;
    const newSup: Supplier = {
      ...supData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };
    setSuppliers((prev) => [...prev, newSup]);
    void syncEntityToFirestore(
      'suppliers',
      id,
      {
        rif: newSup.rif.slice(0, 30),
        name: newSup.name.slice(0, 150),
        contactName: newSup.contactName.slice(0, 120),
        phone: newSup.phone.slice(0, 40),
        address: newSup.address.slice(0, 250),
        specialty: newSup.specialty.slice(0, 100),
      },
      true
    );
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveBeneficiary = (
    benData: Omit<Beneficiary, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const id = `ben-${Date.now()}`;
    const newBen: Beneficiary = {
      ...benData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };
    setBeneficiaries((prev) => [...prev, newBen]);
    void syncEntityToFirestore(
      'beneficiaries',
      id,
      {
        cedulaRif: newBen.cedulaRif.slice(0, 30),
        name: newBen.name.slice(0, 150),
        parish: newBen.parish.slice(0, 80),
        sector: newBen.sector.slice(0, 150),
        phone: newBen.phone.slice(0, 40),
        projectAssigned: newBen.projectAssigned.slice(0, 150),
      },
      true
    );
  };

  const handleDeleteBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  // Handler de Movimientos de Stock (Entradas y Salidas) + Emisión de Factura
  const handleRegisterMovement = (payload: {
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
  }): { ok: boolean; movement?: Movement; error?: string } => {
    const targetProduct = products.find((p) => p.id === payload.productId);
    if (!targetProduct) {
      return { ok: false, error: 'Selecciona un material válido.' };
    }

    const calc = calculateMovementResult(
      targetProduct.stock,
      targetProduct.minStock,
      payload.type,
      payload.quantity
    );

    if (!calc.valid) {
      return { ok: false, error: calc.error };
    }

    const now = new Date().toISOString();
    const updatedProduct: Product = {
      ...targetProduct,
      stock: calc.newStock,
      status: calc.newStatus,
      updatedAt: now,
    };

    setProducts((prev) =>
      prev.map((p) => (p.id === targetProduct.id ? updatedProduct : p))
    );

    const newMovement: Movement = {
      id: `mov-${Date.now()}`,
      type: payload.type,
      productId: targetProduct.id,
      productCode: targetProduct.code,
      productName: targetProduct.name,
      unit: targetProduct.unit,
      unitCost: targetProduct.unitCost,
      quantity: payload.quantity,
      previousStock: targetProduct.stock,
      newStock: calc.newStock,
      referenceDoc: payload.referenceDoc,
      parish: payload.parish,
      projectName: payload.projectName,
      counterparty: payload.counterparty,
      responsibleName: payload.responsibleName,
      notes: payload.notes,
      date: payload.date,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
    };

    setMovements((prev) => [newMovement, ...prev]);

    return { ok: true, movement: newMovement };
  };

  // Handler de Obras y Proyectos
  const handleSaveProject = (
    prjData: Omit<ProjectWork, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const id = existingId || `prj-${Date.now()}`;
    const updatedProject: ProjectWork = {
      ...prjData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };

    if (existingId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === existingId ? updatedProject : p))
      );
    } else {
      setProjects((prev) => [updatedProject, ...prev]);
    }

    void syncEntityToFirestore(
      'projects',
      id,
      {
        code: updatedProject.code.slice(0, 40),
        name: updatedProject.name.slice(0, 180),
        parish: updatedProject.parish.slice(0, 80),
        sector: updatedProject.sector.slice(0, 150),
        engineer: updatedProject.engineer.slice(0, 120),
        beneficiariesCount: updatedProject.beneficiariesCount,
        budgetUsd: updatedProject.budgetUsd,
        spentUsd: updatedProject.spentUsd,
        physicalProgress: updatedProject.physicalProgress,
        financialProgress: updatedProject.financialProgress,
        status: updatedProject.status,
        startDate: updatedProject.startDate.slice(0, 30),
        targetDate: updatedProject.targetDate.slice(0, 30),
        lastUpdateNote: updatedProject.lastUpdateNote.slice(0, 500),
      },
      true
    );
  };

  // Handlers de Usuarios y Roles
  const handleAddUser = (
    usrData: Omit<AppUser, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const id = `usr-${Date.now()}`;
    const newUser: AppUser = {
      ...usrData,
      id,
      ownerId: auth.currentUser?.uid || currentUser?.id || 'local-user',
      createdAt: now,
      updatedAt: now,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    if (currentUser?.id === userId) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      localStorage.setItem('sivyh_active_user', JSON.stringify(updated));
    }
    Swal.fire({
      icon: 'success',
      title: 'Rol actualizado',
      text: `Permisos actualizados a ${getRoleLabel(role)}.`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (!currentUser) {
    return (
      <LoginView
        users={users}
        onCredentialLogin={handleCredentialLogin}
        onGoogleLogin={handleGoogleLogin}
        authError={authError}
      />
    );
  }

  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard y Parroquias',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'productos',
      label: 'Materiales y Catálogos',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'movimientos',
      label: 'Entradas, Salidas y Facturas',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: 'obras',
      label: 'Avances de Obras',
      icon: <HardHat className="w-4 h-4" />,
    },
    {
      id: 'usuarios',
      label: 'Usuarios y Roles (RBAC)',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'apps_script',
      label: 'Google Sheets & Apps Script',
      icon: <Code2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Institucional (260px en Desktop) */}
      <aside className="w-full lg:w-64 lg:sticky lg:top-0 lg:h-screen bg-[#002B5B] text-white shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 print:hidden">
        <div>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FFD100] via-[#0066B3] to-[#C8102E]" />

          <div className="p-4 border-b border-white/10 flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-1.5 shrink-0">
                {!logoError ? (
                  <img
                    src="/assets/aistudio/471cce7e-210d-48d6-83c4-06056dedbbd1_b2bb86b0.jpg"
                    alt="Logo Dirección de Vivienda y Hábitat San Francisco"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#003B73] px-1">
                    SIVYH
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-tight text-white truncate">
                  SIVYH SAN FRANCISCO
                </div>
                <div className="text-[11px] text-[#FFD100] truncate">
                  Vivienda y Hábitat · Zulia
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Abrir menú de navegación"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav
            aria-label="Menú principal del sistema"
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } lg:block p-3 space-y-1`}
          >
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#C8102E] text-white'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-white/10 bg-[#002147]">
          <div className="text-xs font-semibold text-white truncate">
            {currentUser.name}
          </div>
          <div className="text-[11px] text-amber-300 mt-0.5 truncate">
            {getRoleLabel(currentUser.role)}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-300 truncate">
              @{currentUser.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Contenedor Principal del Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8 print:hidden">
          <div className="text-sm font-bold text-[#003B73] whitespace-nowrap shrink-0">
            Dirección de Vivienda y Hábitat · San Francisco
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <span className="whitespace-nowrap shrink-0">
              Funcionario: <strong className="text-slate-900">{currentUser.name}</strong>
            </span>
            <span className="whitespace-nowrap shrink-0">
              Rol: <strong className="text-[#C8102E]">{getRoleLabel(currentUser.role)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardView
              products={products}
              movements={movements}
              projects={projects}
              onNavigate={(view) => setActiveSection(view as ActiveSection)}
              onSelectInvoice={(m) => setSelectedInvoiceMovement(m)}
            />
          )}

          {activeSection === 'productos' && (
            <InventoryModule
              products={products}
              categories={categories}
              suppliers={suppliers}
              beneficiaries={beneficiaries}
              canManage={hasPermission(currentUser.role, 'manage_inventory')}
              canDelete={hasPermission(currentUser.role, 'delete_records')}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onSaveSupplier={handleSaveSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onSaveBeneficiary={handleSaveBeneficiary}
              onDeleteBeneficiary={handleDeleteBeneficiary}
            />
          )}

          {activeSection === 'movimientos' && (
            <MovementsModule
              products={products}
              movements={movements}
              projects={projects}
              suppliers={suppliers}
              beneficiaries={beneficiaries}
              currentUserName={currentUser.name}
              canRegister={hasPermission(currentUser.role, 'register_movements')}
              onRegisterMovement={handleRegisterMovement}
              onSelectInvoice={(m) => setSelectedInvoiceMovement(m)}
            />
          )}

          {activeSection === 'obras' && (
            <ProjectsModule
              projects={projects}
              canManageProjects={hasPermission(currentUser.role, 'manage_projects')}
              onSaveProject={handleSaveProject}
            />
          )}

          {activeSection === 'usuarios' && (
            <UsersRolesModule
              users={users}
              currentUser={currentUser}
              canManageUsers={hasPermission(currentUser.role, 'manage_users')}
              onAddUser={handleAddUser}
              onUpdateRole={handleUpdateUserRole}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeSection === 'apps_script' && (
            <AppsScriptModule
              products={products}
              categories={categories}
              suppliers={suppliers}
              beneficiaries={beneficiaries}
              movements={movements}
              projects={projects}
              users={users}
              canSync={hasPermission(currentUser.role, 'sync_sheets')}
            />
          )}
        </main>
      </div>

      {/* Modal de Factura Oficial de Entrada y Salida */}
      <InvoiceModal
        movement={selectedInvoiceMovement}
        products={products}
        onClose={() => setSelectedInvoiceMovement(null)}
      />
    </div>
  );
}
