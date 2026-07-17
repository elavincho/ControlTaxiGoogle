/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { calculateSummary, filterByRange, getTodayDateString, parseLocalDate } from '../utils/storage';
import { Viaje, GastoCombustible, Mantenimiento, MonotributoRecord, SeguroRecord, PatenteRecord, FilterRange } from '../types';
import { 
  getViajes,
  getCombustible,
  getMantenimiento,
  getMonotributo,
  getSeguro,
  getPatente
} from '../utils/api';
import { 
  DollarSign, 
  Calendar, 
  Activity,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface ResumenesProps {
  userId: string;
}

export default function Resumenes({ userId }: ResumenesProps) {
  const REFERENCE_DATE = getTodayDateString();
  const [selectedDailyDate, setSelectedDailyDate] = useState(REFERENCE_DATE);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterRange>('mes');

  // States for datasets
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [combustibles, setCombustibles] = useState<GastoCombustible[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [monotributos, setMonotributos] = useState<MonotributoRecord[]>([]);
  const [seguros, setSeguros] = useState<SeguroRecord[]>([]);
  const [patentes, setPatentes] = useState<PatenteRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadData = () => {
      Promise.all([
        getViajes(userId),
        getCombustible(userId),
        getMantenimiento(userId),
        getMonotributo(userId),
        getSeguro(userId),
        getPatente(userId)
      ])
        .then(([vList, cList, mList, mtList, sList, pList]) => {
          if (active) {
            setViajes(vList);
            setCombustibles(cList);
            setMantenimientos(mList);
            setMonotributos(mtList);
            setSeguros(sList);
            setPatentes(pList);
          }
        })
        .catch((err) => console.error("Error loading summaries:", err))
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadData();

    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      active = false;
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [userId]);

  // Map fechaPago to fecha for compatibility with filterByRange
  const monotributosMapped = monotributos.map(m => ({ ...m, fecha: m.fechaPago }));
  const segurosMapped = seguros.map(s => ({ ...s, fecha: s.fechaPago }));
  const patentesMapped = patentes.map(p => ({ ...p, fecha: p.fechaPago }));

  // --- DYNAMIC PERIOD SUMMARY ---
  const viajesPeriodo = filterByRange<Viaje>(viajes, selectedPeriod, REFERENCE_DATE);
  const combustiblesPeriodo = filterByRange<GastoCombustible>(combustibles, selectedPeriod, REFERENCE_DATE);
  const mantenimientosPeriodo = filterByRange<Mantenimiento>(mantenimientos, selectedPeriod, REFERENCE_DATE);
  const monotributosPeriodo = filterByRange<MonotributoRecord & { fecha: string }>(monotributosMapped, selectedPeriod, REFERENCE_DATE);
  const segurosPeriodo = filterByRange<SeguroRecord & { fecha: string }>(segurosMapped, selectedPeriod, REFERENCE_DATE);
  const patentesPeriodo = filterByRange<PatenteRecord & { fecha: string }>(patentesMapped, selectedPeriod, REFERENCE_DATE);

  const periodStats = calculateSummary(viajesPeriodo, combustiblesPeriodo, mantenimientosPeriodo);
  const totalMonotributoPeriodo = monotributosPeriodo.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroPeriodo = segurosPeriodo.reduce((sum, s) => sum + s.importe, 0);
  const totalPatentePeriodo = patentesPeriodo.reduce((sum, p) => sum + p.importe, 0);
  const totalGastosPeriodoFinal = periodStats.gastosTotales + totalMonotributoPeriodo + totalSeguroPeriodo + totalPatentePeriodo;
  const gananciaNetaPeriodoFinal = periodStats.ingresosTotales - totalGastosPeriodoFinal;

  // --- SELECTED DAY SUMMARY ---
  const viajesDia = viajes.filter(v => v.fecha === selectedDailyDate);
  const combustiblesDia = combustibles.filter(c => c.fecha === selectedDailyDate);
  const mantenimientosDia = mantenimientos.filter(m => m.fecha === selectedDailyDate);
  const monotributosDia = monotributos.filter(m => m.fechaPago === selectedDailyDate);
  const segurosDia = seguros.filter(s => s.fechaPago === selectedDailyDate);
  const patentesDia = patentes.filter(p => p.fechaPago === selectedDailyDate);

  const dailyStats = calculateSummary(viajesDia, combustiblesDia, mantenimientosDia);
  const totalMonotributoDia = monotributosDia.reduce((sum, m) => sum + m.importe, 0);
  const totalSeguroDia = segurosDia.reduce((sum, s) => sum + s.importe, 0);
  const totalPatenteDia = patentesDia.reduce((sum, p) => sum + p.importe, 0);
  const totalGastosDiaFinal = dailyStats.gastosTotales + totalMonotributoDia + totalSeguroDia + totalPatenteDia;
  const gananciaNetaDiaFinal = dailyStats.ingresosTotales - totalGastosDiaFinal;

  // Trips breakdown by platform for selected day
  const totalViajesDia = viajesDia.length;
  const countByTipo: Record<string, number> = {
    'Taxi (Calle)': 0,
    'Uber': 0,
    'Didi': 0,
    'Cabify': 0,
    'BA Taxi': 0,
  };

  viajesDia.forEach(v => {
    const t = v.tipoViaje || 'Taxi (Calle)';
    if (t === 'Taxi (Calle)' || t === 'Taxi(Calle)') {
      countByTipo['Taxi (Calle)']++;
    } else if (t === 'Uber') {
      countByTipo['Uber']++;
    } else if (t === 'Didi') {
      countByTipo['Didi']++;
    } else if (t === 'Cabify') {
      countByTipo['Cabify']++;
    } else if (t === 'BA Taxi') {
      countByTipo['BA Taxi']++;
    } else {
      countByTipo['Taxi (Calle)']++;
    }
  });

  // --- DATE/PERIOD CHART GENERATION HELPERS ---
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysOfCurrentWeek = (referenceDateStr: string): Date[] => {
    const refDate = parseLocalDate(referenceDateStr);
    const day = refDate.getDay();
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1); // Monday is first day
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaysOfCurrentMonth = (referenceDateStr: string): Date[] => {
    const refDate = parseLocalDate(referenceDateStr);
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getMonthsOfCurrentYear = (referenceDateStr: string): { name: string; year: number; month: number }[] => {
    const refDate = parseLocalDate(referenceDateStr);
    const year = refDate.getFullYear();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return monthNames.map((name, index) => ({
      name,
      year,
      month: index
    }));
  };

  const getChartData = () => {
    if (selectedPeriod === 'semana') {
      const days = getDaysOfCurrentWeek(REFERENCE_DATE);
      return days.map(dayDate => {
        const dateStr = formatDateToYYYYMMDD(dayDate);
        const name = dayDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

        const vDay = viajes.filter(v => v.fecha === dateStr);
        const cDay = combustibles.filter(c => c.fecha === dateStr);
        const mDay = mantenimientos.filter(m => m.fecha === dateStr);
        const mtDay = monotributos.filter(m => m.fechaPago === dateStr);
        const sDay = seguros.filter(s => s.fechaPago === dateStr);
        const pDay = patentes.filter(p => p.fechaPago === dateStr);

        const vDayStats = calculateSummary(vDay, cDay, mDay);
        const mtDaySum = mtDay.reduce((sum, m) => sum + m.importe, 0);
        const sDaySum = sDay.reduce((sum, s) => sum + s.importe, 0);
        const pDaySum = pDay.reduce((sum, p) => sum + p.importe, 0);

        return {
          name,
          "Ingresos": vDayStats.ingresosTotales,
          "Gasto GNC": vDayStats.gastosGNC,
          "Gasto Nafta": vDayStats.gastosNafta,
          "Monotributo": mtDaySum,
          "Seguro": sDaySum,
          "Patente": pDaySum,
          "Viajes Completados": vDay.length,
          "Cargas Realizadas": cDay.length
        };
      });
    }

    if (selectedPeriod === 'mes') {
      const days = getDaysOfCurrentMonth(REFERENCE_DATE);
      return days.map(dayDate => {
        const dateStr = formatDateToYYYYMMDD(dayDate);
        const name = dayDate.getDate().toString();

        const vDay = viajes.filter(v => v.fecha === dateStr);
        const cDay = combustibles.filter(c => c.fecha === dateStr);
        const mDay = mantenimientos.filter(m => m.fecha === dateStr);
        const mtDay = monotributos.filter(m => m.fechaPago === dateStr);
        const sDay = seguros.filter(s => s.fechaPago === dateStr);
        const pDay = patentes.filter(p => p.fechaPago === dateStr);

        const vDayStats = calculateSummary(vDay, cDay, mDay);
        const mtDaySum = mtDay.reduce((sum, m) => sum + m.importe, 0);
        const sDaySum = sDay.reduce((sum, s) => sum + s.importe, 0);
        const pDaySum = pDay.reduce((sum, p) => sum + p.importe, 0);

        return {
          name,
          "Ingresos": vDayStats.ingresosTotales,
          "Gasto GNC": vDayStats.gastosGNC,
          "Gasto Nafta": vDayStats.gastosNafta,
          "Monotributo": mtDaySum,
          "Seguro": sDaySum,
          "Patente": pDaySum,
          "Viajes Completados": vDay.length,
          "Cargas Realizadas": cDay.length
        };
      });
    }

    // Default: 'ano'
    const months = getMonthsOfCurrentYear(REFERENCE_DATE);
    return months.map(m => {
      const vMonth = viajes.filter(v => {
        const d = parseLocalDate(v.fecha);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });
      const cMonth = combustibles.filter(c => {
        const d = parseLocalDate(c.fecha);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });
      const mMonth = mantenimientos.filter(ma => {
        const d = parseLocalDate(ma.fecha);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });
      const mtMonth = monotributos.filter(mo => {
        if (!mo.fechaPago) return false;
        const d = parseLocalDate(mo.fechaPago);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });
      const sMonth = seguros.filter(s => {
        if (!s.fechaPago) return false;
        const d = parseLocalDate(s.fechaPago);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });
      const pMonth = patentes.filter(p => {
        if (!p.fechaPago) return false;
        const d = parseLocalDate(p.fechaPago);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      });

      const vMonthStats = calculateSummary(vMonth, cMonth, mMonth);
      const mtMonthSum = mtMonth.reduce((sum, mo) => sum + mo.importe, 0);
      const sMonthSum = sMonth.reduce((sum, s) => sum + s.importe, 0);
      const pMonthSum = pMonth.reduce((sum, p) => sum + p.importe, 0);

      return {
        name: m.name,
        "Ingresos": vMonthStats.ingresosTotales,
        "Gasto GNC": vMonthStats.gastosGNC,
        "Gasto Nafta": vMonthStats.gastosNafta,
        "Monotributo": mtMonthSum,
        "Seguro": sMonthSum,
        "Patente": pMonthSum,
        "Viajes Completados": vMonth.length,
        "Cargas Realizadas": cMonth.length
      };
    });
  };

  const chartData = getChartData();

  // Labels for rendering
  const getPeriodLabel = () => {
    if (selectedPeriod === 'semana') return 'Semanal';
    if (selectedPeriod === 'ano') return 'Anual';
    return 'Mensual';
  };

  const getPeriodSubLabel = () => {
    if (selectedPeriod === 'semana') return 'Semana actual';
    if (selectedPeriod === 'ano') return `Año ${new Date(REFERENCE_DATE).getFullYear()}`;
    return new Date(REFERENCE_DATE).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  };

  if (loading && viajes.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4" id="resumenes-loading">
        <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-widest">Cargando auditoría financiera...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-12" id="resumenes-view">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900 font-display uppercase">Auditoría Financiera Integral</h2>
        <p className="text-xs text-slate-400 font-bold">Resúmenes estadísticos detallados de tu actividad diaria y por períodos.</p>
      </div>

      {/* SECTION 1: RESUMEN DEL PERÍODO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-black text-slate-900 font-display uppercase">
              Resumen {getPeriodLabel()} <span className="text-slate-450 font-mono text-xs font-normal">({getPeriodSubLabel()})</span>
            </h3>
          </div>

          {/* Period filter buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-sm" id="period-filters">
            <button
              onClick={() => setSelectedPeriod('semana')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedPeriod === 'semana' 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setSelectedPeriod('mes')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedPeriod === 'mes' 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setSelectedPeriod('ano')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedPeriod === 'ano' 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Año
            </button>
          </div>
        </div>

        {/* 3x4 Grid of stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingresos */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Ingresos {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-emerald-600">$ {periodStats.ingresosTotales.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Suma total recaudada en viajes</p>
            </div>
          </div>

          {/* Gasto GNC */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Gasto GNC {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-yellow-600">$ {periodStats.gastosGNC.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Cargas de GNC realizadas</p>
            </div>
          </div>

          {/* Gasto Nafta */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Gasto Nafta {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-orange-600">$ {periodStats.gastosNafta.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Combustible líquido alternativo</p>
            </div>
          </div>

          {/* Gasto Monotributo */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Monotributo {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-purple-600">$ {totalMonotributoPeriodo.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Impuesto monotributo pagado</p>
            </div>
          </div>

          {/* Gasto Seguro */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Seguro {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-pink-600">$ {totalSeguroPeriodo.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Seguro de taxi pagado</p>
            </div>
          </div>

          {/* Gasto Patente */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Patente {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-cyan-600">$ {totalPatentePeriodo.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Impuesto de patente pagado</p>
            </div>
          </div>

          {/* Total Gastos */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-rose-500 shadow-sm">
            <span className="text-[10px] font-mono text-rose-500 uppercase font-black block mb-2">Total de Gastos</span>
            <div>
              <h4 className="text-2xl font-black text-rose-600">$ {totalGastosPeriodoFinal.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-455 font-bold mt-1">Combustibles + Taller + Monotributo + Seguro + Patente</p>
            </div>
          </div>

          {/* Ganancia Neta */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-yellow-400 shadow-sm">
            <span className="text-[10px] font-mono text-yellow-600 uppercase font-black block mb-2">Ganancia Neta {getPeriodLabel()}</span>
            <div>
              <h4 className="text-2xl font-black text-slate-900">$ {gananciaNetaPeriodoFinal.toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Beneficio limpio de impuestos y combustible</p>
            </div>
          </div>

          {/* Cantidad de Viajes Realizados */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Viajes Completados</span>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{periodStats.cantViajes} <span className="text-xs font-bold text-slate-450">viajes</span></h4>
              <p className="text-[10px] text-slate-455 font-bold mt-1">Pasajeros trasladados en el período</p>
            </div>
          </div>

          {/* Cargas GNC y Nafta */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Cargas Realizadas</span>
            <div>
              <h4 className="text-xl font-black text-slate-900">
                GNC: {periodStats.cantCargasGNC} <span className="text-slate-300 font-black">•</span> Nafta: {periodStats.cantCargasNafta}
              </h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Cantidad de visitas al surtidor</p>
            </div>
          </div>

          {/* Promedio Viajes Realizados */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-mono text-slate-455 uppercase font-black block mb-2">Ingreso Promedio</span>
            <div>
              <h4 className="text-2xl font-black text-yellow-600">$ {Math.round(periodStats.promedioViaje).toLocaleString()}</h4>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Ingreso estimado por viaje individual</p>
            </div>
          </div>
        </div>

        {/* LINE CHART: EVOLUCIÓN FINANCIERA DEL PERÍODO */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6" id="resumenes-chart-container">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-900 font-display uppercase flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-yellow-500" />
                Evolución Detallada {getPeriodLabel()}
              </h4>
            </div>
          </div>

          <div className="w-full h-[450px]" id="resumenes-composed-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 5, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card-sub, #f1f5f9)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted, #64748b)" 
                  fontSize={10} 
                  tickLine={false} 
                  tickMargin={8}
                />
                {/* Left Y-Axis for Currencies */}
                <YAxis 
                  yAxisId="left"
                  stroke="var(--text-muted, #64748b)" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                  tickMargin={8}
                  width={75}
                />
                {/* Right Y-Axis for Counts (Viajes and Cargas) */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--text-muted, #64748b)" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val}`}
                  tickMargin={8}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card, #ffffff)', 
                    borderColor: 'var(--border-card, #e2e8f0)', 
                    borderRadius: '12px',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '11px'
                  }}
                  labelStyle={{ color: 'var(--text-primary, #0f172a)', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--text-secondary, #475569)', padding: '2px 0' }}
                  formatter={(value: any, name: string) => {
                    if (name === "Viajes Completados" || name === "Cargas Realizadas") {
                      return [`${value}`, name];
                    }
                    return [`$ ${Number(value).toLocaleString()}`, name];
                  }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} 
                />
                
                {/* Financial bars (left scale) */}
                <Bar 
                  yAxisId="left"
                  dataKey="Ingresos" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 8 : 20}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="Gasto GNC" 
                  fill="#eab308" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 4 : 10}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="Gasto Nafta" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 4 : 10}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="Monotributo" 
                  fill="#a855f7" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 4 : 10}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="Seguro" 
                  fill="#ec4899" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 4 : 10}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="Patente" 
                  fill="#06b6d4" 
                  radius={[4, 4, 0, 0]}
                  barSize={selectedPeriod === 'mes' ? 4 : 10}
                />

                {/* Count lines (right scale) */}
                <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="Viajes Completados" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="Cargas Realizadas" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>


        </div>
      </div>

      {/* SECTION 2: RESUMEN DIARIO */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-black text-slate-900 font-display uppercase">Auditoría Diaria Interactiva</h3>
          </div>
          
          {/* Date Selector to audit any day */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-mono font-bold">Seleccione fecha de auditoría:</span>
            <input
              type="date"
              value={selectedDailyDate}
              onChange={(e) => setSelectedDailyDate(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-yellow-400 font-mono shadow-sm"
            />
          </div>
        </div>

        {/* Daily Stats Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-mono">Informe para la fecha: {selectedDailyDate}</h4>
              <p className="text-xs text-slate-450 font-bold">Cálculos automáticos en tiempo real basados en tus cargas</p>
            </div>
            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
              dailyStats.gananciaNeta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {dailyStats.gananciaNeta >= 0 ? 'Superávit diario' : 'Déficit diario'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: Ingreso total */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-455 uppercase font-black block">Ingreso Total Diario</span>
              <div className="text-2xl font-black text-emerald-600">$ {dailyStats.ingresosTotales.toLocaleString()}</div>
              <div className="text-[10px] text-slate-450 font-mono font-bold mt-0.5">({viajesDia.length} viajes realizados)</div>
            </div>

            {/* KPI 2: Gastos GNC */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-455 uppercase font-black block">Gasto GNC Diario</span>
              <div className="text-2xl font-black text-yellow-600">$ {dailyStats.gastosGNC.toLocaleString()}</div>
              <div className="text-[10px] text-slate-455 font-mono font-bold mt-0.5">
                ({combustiblesDia.filter(c => c.tipo === 'GNC').length} cargas registradas)
              </div>
            </div>

            {/* KPI 3: Gastos Nafta */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-455 uppercase font-black block">Gasto Nafta Diario</span>
              <div className="text-2xl font-black text-orange-600">$ {dailyStats.gastosNafta.toLocaleString()}</div>
              <div className="text-[10px] text-slate-455 font-mono font-bold mt-0.5">
                ({combustiblesDia.filter(c => c.tipo === 'Nafta').length} cargas registradas)
              </div>
            </div>

            {/* KPI 4: Total Gastos */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-455 uppercase font-black block">Total de Gastos Diario</span>
              <div className="text-2xl font-black text-rose-600">$ {totalGastosDiaFinal.toLocaleString()}</div>
              <div className="text-[10px] text-slate-450 font-mono font-bold mt-0.5">
                (Combustibles + Talleres + Monotributo + Seguro + Patente)
              </div>
            </div>
          </div>

          {/* Highlighted Net Result Row */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl gap-4">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                gananciaNetaDiaFinal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-455 uppercase font-black block">Ganancia Neta Limpia (Día)</span>
                <span className="text-xs text-slate-500 font-bold">Total ingresos menos total gastos diarios</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-black font-mono ${
                gananciaNetaDiaFinal >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                $ {gananciaNetaDiaFinal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Platform breakdown section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h5 className="text-xs font-mono font-black text-slate-455 uppercase tracking-wider">
                Desglose de Viajes por Plataforma
              </h5>
              <div className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-3 py-1 text-xs font-mono font-bold self-start sm:self-auto">
                Total del día: {totalViajesDia} {totalViajesDia === 1 ? 'viaje' : 'viajes'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(countByTipo).map(([tipo, count]) => {
                const percentage = totalViajesDia > 0 ? (count / totalViajesDia) * 100 : 0;
                
                let badgeStyle = '';
                let progressColor = '';
                
                if (tipo === 'Taxi (Calle)') {
                  badgeStyle = 'bg-amber-500 text-white border-amber-600';
                  progressColor = 'bg-amber-500';
                } else if (tipo === 'Uber') {
                  badgeStyle = 'badge-uber';
                  progressColor = 'progress-uber';
                } else if (tipo === 'Didi') {
                  badgeStyle = 'bg-orange-500 text-white border-orange-600';
                  progressColor = 'bg-orange-500';
                } else if (tipo === 'Cabify') {
                  badgeStyle = 'bg-purple-600 text-white border-purple-700';
                  progressColor = 'bg-purple-600';
                } else if (tipo === 'BA Taxi') {
                  badgeStyle = 'bg-cyan-500 text-white border-cyan-600';
                  progressColor = 'bg-cyan-500';
                }

                return (
                  <div key={tipo} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm" id={`breakdown-${tipo.replace(/\s+/g, '-')}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm ${badgeStyle}`}>
                        {tipo}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900 whitespace-nowrap">
                        {count} {count === 1 ? 'viaje' : 'viajes'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-450 font-mono">
                        <span>Porcentaje</span>
                        <span className="font-bold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
