import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Database,
} from 'lucide-react';
import {
  Product,
  Category,
  Supplier,
  Beneficiary,
  Movement,
  ProjectWork,
  AppUser,
} from '../types/inventory';
import { exportFullGoogleSheetsTemplate } from '../utils/excelExport';

interface AppsScriptModuleProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  beneficiaries: Beneficiary[];
  movements: Movement[];
  projects: ProjectWork[];
  users: AppUser[];
  canSync: boolean;
}

export const CODE_GS_SOURCE = `/**
 * SISTEMA DE INVENTARIO Y CONTROL DE OBRAS (SIVYH)
 * Dirección de Vivienda y Hábitat - Alcaldía Bolivariana de San Francisco, Edo. Zulia
 * Archivo: Code.gs (Google Apps Script Backend API + Google Sheets Database)
 */

const SHEETS_CONFIG = {
  Productos: ['id', 'code', 'name', 'category', 'unit', 'stock', 'minStock', 'unitCost', 'warehouse', 'supplierName', 'status', 'updatedAt'],
  Categorias: ['id', 'code', 'name', 'description', 'updatedAt'],
  Proveedores: ['id', 'rif', 'name', 'contactName', 'phone', 'address', 'specialty', 'updatedAt'],
  Beneficiarios: ['id', 'cedulaRif', 'name', 'parish', 'sector', 'phone', 'projectAssigned', 'updatedAt'],
  Movimientos: ['id', 'date', 'type', 'productId', 'productCode', 'productName', 'unit', 'unitCost', 'quantity', 'previousStock', 'newStock', 'referenceDoc', 'parish', 'projectName', 'counterparty', 'responsibleName', 'notes'],
  Obras: ['id', 'code', 'name', 'parish', 'sector', 'engineer', 'beneficiariesCount', 'budgetUsd', 'spentUsd', 'physicalProgress', 'financialProgress', 'status', 'startDate', 'targetDate', 'lastUpdateNote'],
  Usuarios: ['id', 'name', 'username', 'email', 'role', 'department', 'active']
};

/**
 * 1. EJECUTAR ESTA FUNCIÓN PRIMERO: Crea automáticamente las 7 hojas con encabezados institucionales
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS_CONFIG).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      const headers = SHEETS_CONFIG[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#003B73')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
  return 'Base de datos SIVYH San Francisco inicializada correctamente en Google Sheets.';
}

/**
 * Sirve la interfaz HTML o responde peticiones GET de la API REST
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getAllData') {
    return ContentService
      .createTextOutput(JSON.stringify(getAllDatabaseRecords()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SIVYH San Francisco - Dirección de Vivienda y Hábitat')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Recibe sincronizaciones POST (Crear/Actualizar Productos, Movimientos, Obras y Usuarios)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'syncAll') {
      Object.keys(SHEETS_CONFIG).forEach(sheetName => {
        const keyMap = {
          Productos: 'products',
          Categorias: 'categories',
          Proveedores: 'suppliers',
          Beneficiarios: 'beneficiaries',
          Movimientos: 'movements',
          Obras: 'projects',
          Usuarios: 'users'
        };
        const items = payload.data[keyMap[sheetName]] || [];
        overwriteSheetData(sheetName, items);
      });
      return jsonResponse({ ok: true, message: 'Sincronización completa con Google Sheets exitosa' });
    }

    if (action === 'addMovement') {
      appendRowToSheet('Movimientos', payload.movement);
      return jsonResponse({ ok: true, message: 'Movimiento registrado en Google Sheets' });
    }

    return jsonResponse({ ok: false, error: 'Acción no reconocida' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getAllDatabaseRecords() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  Object.keys(SHEETS_CONFIG).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) {
      result[sheetName] = [];
      return;
    }
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();
    result[sheetName] = values.map(row => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx]; });
      return obj;
    });
  });
  return { ok: true, data: result };
}

function overwriteSheetData(sheetName, items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  const headers = SHEETS_CONFIG[sheetName];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (items.length > 0) {
    const rows = items.map(item => headers.map(h => item[h] !== undefined ? item[h] : ''));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function appendRowToSheet(sheetName, item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SHEETS_CONFIG[sheetName];
  const row = headers.map(h => item[h] !== undefined ? item[h] : '');
  sheet.appendRow(row);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const INDEX_HTML_BOOTSTRAP_SOURCE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>SIVYH San Francisco - Dirección de Vivienda y Hábitat</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <!-- SheetJS para Exportar a Excel -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
    :root {
      --sivyh-navy: #003B73;
      --sivyh-blue: #0066B3;
      --sivyh-red: #C8102E;
      --sivyh-gold: #FFD100;
    }
    body { background-color: #f4f6f9; font-family: 'Segoe UI', system-ui, sans-serif; }
    .sidebar { background: linear-gradient(180deg, var(--sivyh-navy) 0%, #002347 100%); min-height: 100vh; color: #fff; }
    .sidebar .nav-link { color: rgba(255,255,255,0.82); border-radius: 8px; margin-bottom: 4px; }
    .sidebar .nav-link.active, .sidebar .nav-link:hover { background-color: var(--sivyh-red); color: #fff; }
    .brand-banner { border-bottom: 3px solid var(--sivyh-gold); }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
  </style>
</head>
<body>
  <!-- Interfaz conectada a google.script.run y Firebase Auth RBAC -->
  <div class="container-fluid">
    <div class="row">
      <nav class="col-md-3 col-lg-2 d-md-block sidebar p-3">
        <div class="brand-banner pb-3 mb-3 text-center">
          <h6 class="fw-bold mb-0">ALCALDÍA DE SAN FRANCISCO</h6>
          <small class="text-warning">Dirección de Vivienda y Hábitat</small>
        </div>
        <ul class="nav flex-column">
          <li class="nav-item"><a class="nav-link active" href="#dashboard"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
          <li class="nav-item"><a class="nav-link" href="#productos"><i class="bi bi-box-seam me-2"></i>Materiales y Stock</a></li>
          <li class="nav-item"><a class="nav-link" href="#movimientos"><i class="bi bi-arrow-left-right me-2"></i>Entradas y Salidas</a></li>
          <li class="nav-item"><a class="nav-link" href="#obras"><i class="bi bi-building-check me-2"></i>Avances de Obras</a></li>
        </ul>
      </nav>
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
        <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
          <h4 class="fw-bold text-dark mb-0">Sistema de Inventario y Obras (SIVYH)</h4>
          <button class="btn btn-primary" onclick="cargarDatosDesdeSheets()">
            <i class="bi bi-arrow-clockwise me-1"></i> Sincronizar Google Sheets
          </button>
        </div>
        <div id="contenido-principal">Cargando datos desde Google Sheets...</div>
      </main>
    </div>
  </div>
  <script>
    function cargarDatosDesdeSheets() {
      Swal.fire({ title: 'Sincronizando con Google Sheets...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(res => {
          Swal.fire('Conectado', 'Datos cargados desde Google Sheets', 'success');
        }).getAllDatabaseRecords();
      } else {
        Swal.fire('Modo Web App', 'Ejecutando fuera del contenedor HtmlService', 'info');
      }
    }
  </script>
</body>
</html>`;

export const AppsScriptModule: React.FC<AppsScriptModuleProps> = ({
  products,
  categories,
  suppliers,
  beneficiaries,
  movements,
  projects,
  users,
  canSync,
}) => {
  const [webAppUrl, setWebAppUrl] = useState<string>(
    () => localStorage.getItem('sivyh_gas_webapp_url') || ''
  );
  const [activeTab, setActiveTab] = useState<'guia' | 'code_gs' | 'html_bs5'>('guia');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveUrl = (url: string) => {
    setWebAppUrl(url);
    localStorage.setItem('sivyh_gas_webapp_url', url);
  };

  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(label);
    Swal.fire({
      icon: 'success',
      title: 'Código copiado al portapapeles',
      text: `El archivo ${label} está listo para pegar en Google Apps Script.`,
      timer: 2000,
      showConfirmButton: false,
    });
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleSyncWithGoogleSheets = async () => {
    if (!webAppUrl.trim() || !webAppUrl.startsWith('https://script.google.com/')) {
      Swal.fire({
        icon: 'warning',
        title: 'URL de Google Apps Script requerida',
        text: 'Ingresa una URL válida de implementación de Google Apps Script (https://script.google.com/macros/s/.../exec) o descarga la plantilla Excel de 7 hojas.',
        confirmButtonColor: '#003B73',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await fetch(webAppUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncAll',
          data: {
            products,
            categories,
            suppliers,
            beneficiaries,
            movements,
            projects,
            users,
          },
        }),
      });
      Swal.fire({
        icon: 'success',
        title: 'Sincronización enviada a Google Sheets',
        text: 'Se enviaron los productos, movimientos, obras y catálogos al Web App de Google Apps Script.',
        confirmButtonColor: '#003B73',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión con Apps Script',
        text: error instanceof Error ? error.message : 'Verifica los permisos CORS / "Cualquier persona" en tu despliegue de Apps Script.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo + Conexión en Vivo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-medium text-[#C8102E] mb-1">
              Arquitectura Híbrida · Google Sheets + Google Apps Script + Firebase RBAC
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Conector API Google Apps Script y Guía de Instalación Paso a Paso
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Esta aplicación ya funciona en tiempo real con <strong>Firebase Firestore y Firebase Authentication</strong>, e incluye sincronización directa con <strong>Google Sheets</strong> mediante <strong>Google Apps Script</strong> y exportación de libro completo Excel de 7 pestañas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                exportFullGoogleSheetsTemplate({
                  products,
                  categories,
                  suppliers,
                  beneficiaries,
                  movements,
                  projects,
                  users,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-[#FFD100] hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Base de Datos (7 Hojas .XLSX)
            </button>
          </div>
        </div>

        {/* Conector URL Web App Google Apps Script */}
        <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-9">
            <label
              htmlFor="gas-webapp-url"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              URL del Web App de Google Apps Script (Opcional para sincronización en la nube con tu hoja de cálculo)
            </label>
            <input
              id="gas-webapp-url"
              type="url"
              value={webAppUrl}
              onChange={(e) => handleSaveUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbz.../exec"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B73]"
            />
          </div>
          <div className="lg:col-span-3">
            <button
              type="button"
              disabled={!canSync || isSyncing}
              onClick={handleSyncWithGoogleSheets}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar con Google Sheets'}
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Documentación y Código */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('guia')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'guia'
              ? 'bg-white text-[#003B73] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          01. Guía Paso a Paso de Montaje
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('code_gs')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'code_gs'
              ? 'bg-white text-[#003B73] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          02. Código Backend API (Code.gs)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('html_bs5')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'html_bs5'
              ? 'bg-white text-[#003B73] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          03. Plantilla HTML + Bootstrap 5 (index.html)
        </button>
      </div>

      {activeTab === 'guia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#003B73]">
                PASO 01 · BASE DE DATOS EN GOOGLE SHEETS
              </span>
              <FileSpreadsheet className="w-5 h-5 text-[#003B73]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Crear la Hoja de Cálculo en Google Drive
            </h3>
            <ol className="text-sm text-slate-600 space-y-2.5 list-decimal list-inside">
              <li>
                Ingresa a <strong>Google Drive</strong> con la cuenta institucional (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">deposito.vyh@gmail.com</code>).
              </li>
              <li>
                Haz clic en el botón amarillo arriba <strong>"Descargar Base de Datos (7 Hojas .XLSX)"</strong> o crea una hoja en blanco llamada <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">BD_Inventario_Vivienda_SanFrancisco</code>.
              </li>
              <li>
                La base de datos contiene <strong>7 pestañas exactas</strong>: <code className="font-mono text-xs">Productos</code>, <code className="font-mono text-xs">Categorias</code>, <code className="font-mono text-xs">Proveedores</code>, <code className="font-mono text-xs">Beneficiarios</code>, <code className="font-mono text-xs">Movimientos</code>, <code className="font-mono text-xs">Obras</code> y <code className="font-mono text-xs">Usuarios</code>.
              </li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#C8102E]">
                PASO 02 · BACKEND EN GOOGLE APPS SCRIPT
              </span>
              <Code2 className="w-5 h-5 text-[#C8102E]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Configurar el Script y Ejecutar setupDatabase()
            </h3>
            <ol className="text-sm text-slate-600 space-y-2.5 list-decimal list-inside">
              <li>
                Dentro de tu Google Sheet, abre el menú superior <strong>Extensiones &rarr; Apps Script</strong>.
              </li>
              <li>
                En el archivo <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Código.gs</code>, borra el contenido por defecto y pega el código de la pestaña <strong>"02. Código Backend API (Code.gs)"</strong>.
              </li>
              <li>
                Selecciona la función <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">setupDatabase</code> en la barra superior y presiona <strong>Ejecutar (Run)</strong>. Acepta los permisos de Google Drive/Sheets.
              </li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#003B73]">
                PASO 03 · PUBLICAR COMO API / APLICACIÓN WEB
              </span>
              <ExternalLink className="w-5 h-5 text-[#003B73]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Desplegar el Endpoint Web App
            </h3>
            <ol className="text-sm text-slate-600 space-y-2.5 list-decimal list-inside">
              <li>
                En el editor de Apps Script, haz clic en el botón azul <strong>Implementar (Deploy) &rarr; Nueva implementación</strong>.
              </li>
              <li>
                En <strong>Tipo</strong>, selecciona <strong>Aplicación web (Web App)</strong>.
              </li>
              <li>
                En <em>Ejecutar como</em>: <strong>Yo (deposito.vyh@gmail.com)</strong>. En <em>Quién tiene acceso</em>: <strong>Cualquier persona (Anyone)</strong>.
              </li>
              <li>
                Copia la URL generada (<code className="font-mono text-xs">https://script.google.com/macros/s/.../exec</code>) y pégala en el cuadro superior de esta pantalla para sincronizar en un clic.
              </li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-700">
                PASO 04 · AUTENTICACIÓN Y ROLES CON FIREBASE
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Permisos por Rol en Firebase Auth y Firestore
            </h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>Administrador General (<code className="font-mono text-xs">admin</code>)</strong>: Control total de inventario, obras, usuarios, eliminación de registros y sincronización con Google Sheets.
              </li>
              <li>
                <strong>Jefe de Almacén (<code className="font-mono text-xs">almacenista</code>)</strong>: Creación y edición de materiales, categorías, proveedores, entradas/salidas y reportes Excel.
              </li>
              <li>
                <strong>Ingeniero de Obras (<code className="font-mono text-xs">ingeniero_obras</code>)</strong>: Registro de despachos a obras, actualización de avances físicos/financieros de obras y consulta de stock.
              </li>
              <li>
                <strong>Auditor / Consulta (<code className="font-mono text-xs">consulta</code>)</strong>: Visualización de dashboard, historial Kardex, estado de obras y descarga de reportes en Excel.
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'code_gs' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono font-semibold text-amber-400">
                Code.gs · Google Apps Script Backend API
              </span>
              <p className="text-xs text-slate-400">
                Crea automáticamente las 7 hojas en Google Sheets y expone los métodos doGet() y doPost()
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode(CODE_GS_SOURCE, 'Code.gs')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-[#003B73] hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              {copiedFile === 'Code.gs' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Code.gs
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed max-h-[540px]">
            <code>{CODE_GS_SOURCE}</code>
          </pre>
        </div>
      )}

      {activeTab === 'html_bs5' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono font-semibold text-amber-400">
                index.html · Plantilla Standalone con Bootstrap 5 + SweetAlert2 + Chart.js
              </span>
              <p className="text-xs text-slate-400">
                Para alojar dentro del editor de Google Apps Script junto a Code.gs si se desea usar HtmlService
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode(INDEX_HTML_BOOTSTRAP_SOURCE, 'index.html')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-[#003B73] hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              {copiedFile === 'index.html' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar index.html
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed max-h-[540px]">
            <code>{INDEX_HTML_BOOTSTRAP_SOURCE}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
