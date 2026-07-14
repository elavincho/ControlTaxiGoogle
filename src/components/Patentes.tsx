/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatenteRecord, AlertNotification } from '../types';
import { 
  getStoredPatente, 
  getTodayDateString
} from '../utils/storage';
import { 
  getPatente, 
  savePatente, 
  updatePatente, 
  deletePatente, 
  getAlertas, 
  saveAlerta, 
  deleteAlerta 
} from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Search, 
  X, 
  AlertCircle,
  Coins,
  FileText,
  DollarSign
} from 'lucide-react';

interface PatentesProps {
  userId: string;
}

const MES_OPTIONS = ["ENE/FEB", "MAR/ABR", "MAY/JUN", "JUL/AGO", "SEP/OCT", "NOV/DIC", "ANUAL"];
const ANIO_OPTIONS = ["AÑO 2024", "AÑO 2025", "AÑO 2026", "AÑO 2027", "AÑO 2028"];

function getNextMonthSameDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10); // 1-indexed
  let day = parseInt(parts[2], 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  // Handle cases like Oct 31 -> Nov 31 doesn't exist, cap at max days in month
  const maxDays = new Date(year, month, 0).getDate();
  if (day > maxDays) {
    day = maxDays;
  }

  const mm = month < 10 ? '0' + month : month;
  const dd = day < 10 ? '0' + day : day;
  return `${year}-${mm}-${dd}`;
}

export default function Patentes({ userId }: PatentesProps) {
  const [records, setRecords] = useState<PatenteRecord[]>(() => getStoredPatente(userId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPatente(userId)
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch(err => console.error("Error loading Patentes:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleStorageUpdate = () => {
      getPatente(userId).then((data) => {
        if (active) setRecords(data);
      });
    };
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [userId]);
  
  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatenteRecord | null>(null);
  
  // Form States
  const [fechaPago, setFechaPago] = useState('');
  const [numeroCuota, setNumeroCuota] = useState('');
  const [mes, setMes] = useState('MAR/ABR');
  const [anio, setAnio] = useState('AÑO 2026');
  const [importe, setImporte] = useState('');
  const [fechaProximoVencimiento, setFechaProximoVencimiento] = useState('');
  const [formError, setFormError] = useState('');

  // Local search
  const [searchQuery, setSearchQuery] = useState('');

  const REFERENCE_DATE = getTodayDateString(); // System reference date

  // When payment date changes, auto-set next due date to same day of next month
  useEffect(() => {
    if (fechaPago && !editingRecord) {
      setFechaProximoVencimiento(getNextMonthSameDay(fechaPago));
    }
  }, [fechaPago, editingRecord]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFechaPago(REFERENCE_DATE);
    setNumeroCuota('1');
    setMes('MAR/ABR');
    setAnio('AÑO 2026');
    setImporte('');
    setFechaProximoVencimiento(getNextMonthSameDay(REFERENCE_DATE));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: PatenteRecord) => {
    setEditingRecord(rec);
    setFechaPago(rec.fechaPago);
    setNumeroCuota(rec.numeroCuota);
    setMes(rec.mes);
    setAnio(rec.anio);
    setImporte(rec.importe.toString());
    setFechaProximoVencimiento(rec.fechaProximoVencimiento);
    setFormError('');
    setIsModalOpen(true);
  };

  const syncAlertForRecord = async (record: PatenteRecord, isDeleted = false, oldVencimiento?: string) => {
    try {
      const alerts = await getAlertas(userId);
      const existing = alerts.find(a => 
        a.tipo === 'patente' && 
        (a.fechaLimite === record.fechaProximoVencimiento || (oldVencimiento && a.fechaLimite === oldVencimiento))
      );
      if (existing) {
        await deleteAlerta(existing.id, userId);
      }
      
      if (!isDeleted) {
        await saveAlerta({
          userId: userId,
          tipo: 'patente',
          mensaje: `Pago de Patente (${record.mes} ${record.anio}) - Cuota ${record.numeroCuota}: $${record.importe}`,
          fechaLimite: record.fechaProximoVencimiento,
          resuelta: false
        });
      }
    } catch (e) {
      console.error("Error syncing alert for patente:", e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de Patente?')) {
      const recordToDelete = records.find(r => r.id === id);
      await deletePatente(id, userId);
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      
      if (recordToDelete) {
        await syncAlertForRecord(recordToDelete, true);
      }
      
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fechaPago || !numeroCuota || !mes || !anio || !importe || !fechaProximoVencimiento) {
      setFormError('Por favor complete todos los campos.');
      return;
    }

    const numImporte = parseFloat(importe);
    if (isNaN(numImporte) || numImporte <= 0) {
      setFormError('El importe debe ser un número positivo.');
      return;
    }

    try {
      let savedRecord: PatenteRecord;
      if (editingRecord) {
        // Update
        const oldVencimiento = editingRecord.fechaProximoVencimiento;
        savedRecord = await updatePatente(editingRecord.id, { fechaPago, numeroCuota, mes, anio, importe: numImporte, fechaProximoVencimiento }, userId);
        setRecords(records.map(r => r.id === editingRecord.id ? savedRecord : r));
        await syncAlertForRecord(savedRecord, false, oldVencimiento);
      } else {
        // Create
        savedRecord = await savePatente({ userId, fechaPago, numeroCuota, mes, anio, importe: numImporte, fechaProximoVencimiento });
        setRecords([savedRecord, ...records]);
        await syncAlertForRecord(savedRecord, false);
      }

      setIsModalOpen(false);
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar patente.');
    }
  };

  // Filter records based on search query
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.importe.toString().includes(q) ||
      r.fechaPago.includes(q) ||
      r.numeroCuota.toLowerCase().includes(q) ||
      r.mes.toLowerCase().includes(q) ||
      r.anio.toLowerCase().includes(q) ||
      r.fechaProximoVencimiento.includes(q)
    );
  });

  const totalPagado = records.reduce((sum, r) => sum + r.importe, 0);
  const ultimoPago = records.length > 0 ? records[0].importe : 0;

  return (
    <div className="space-y-6" id="patentes-section">
      {/* 1. Page Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Patentes</h1>
          <p className="text-sm text-slate-500">Administra el pago de patentes automotores de tu vehículo, cuotas y vencimientos.</p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>Registrar Pago</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Histórico</p>
            <p className="text-2xl font-black text-slate-900">${totalPagado.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Último Pago</p>
            <p className="text-2xl font-black text-slate-900">${ultimoPago.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuotas Pagadas</p>
            <p className="text-2xl font-black text-slate-900">{records.length}</p>
          </div>
        </div>
      </div>

      {/* 2. Main Content & Listing */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Buscar por cuota, mes, año..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Mostrando {filteredRecords.length} de {records.length} registros
          </span>
        </div>

        {/* Records Table */}
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-6">Fecha Pago</th>
                  <th className="py-4 px-6">Cuota</th>
                  <th className="py-4 px-6">Mes / Año</th>
                  <th className="py-4 px-6">Importe</th>
                  <th className="py-4 px-6">Próximo Vencimiento</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{rec.fechaPago}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-600">
                      Cuota {rec.numeroCuota}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold uppercase">{rec.mes}</span>
                      <span className="ml-1.5 text-slate-500 font-mono text-xs">{rec.anio}</span>
                    </td>
                    <td className="py-3.5 px-6 font-black text-slate-950 font-mono">
                      ${rec.importe.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-100">
                        {rec.fechaProximoVencimiento}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenEditModal(rec)}
                        className="inline-flex items-center justify-center p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="Modificar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="inline-flex items-center justify-center p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="inline-flex h-12 w-12 rounded-full bg-slate-50 items-center justify-center text-slate-400 border border-slate-150">
              <Coins className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">No se encontraron pagos de Patentes</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Registra tus pagos de patente automotor para hacer un seguimiento exacto de las cuotas y vencimientos del vehículo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 space-y-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    {editingRecord ? 'Modificar Pago de Patente' : 'Registrar Pago de Patente'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Completa el formulario de pago de patente.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Fecha de Pago</label>
                  <input 
                    type="date"
                    required
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-mono"
                  />
                </div>

                {/* Installment Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Número de Cuota</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: 1, 2, Anual"
                    value={numeroCuota}
                    onChange={(e) => setNumeroCuota(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Month Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mes Correspondiente</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-semibold text-slate-700"
                  >
                    {MES_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Año Correspondiente</label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-mono text-slate-700"
                  >
                    {ANIO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount/Import */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Importe ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input 
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={importe}
                      onChange={(e) => setImporte(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Next Expiration Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Próximo Vencimiento</label>
                  <input 
                    type="date"
                    required
                    value={fechaProximoVencimiento}
                    onChange={(e) => setFechaProximoVencimiento(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all cursor-pointer"
                >
                  {editingRecord ? 'Guardar Cambios' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
