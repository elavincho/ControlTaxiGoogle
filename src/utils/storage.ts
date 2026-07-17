/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, 
  Viaje, 
  GastoCombustible, 
  Mantenimiento, 
  AlertNotification, 
  FilterRange, 
  MonotributoRecord, 
  SeguroRecord, 
  PatenteRecord 
} from '../types';

// Simple encryption helper (using a custom hash function for secure storage)
export function encryptPassword(password: string): string {
  const salt = "taxi_app_salt_2026_";
  let hash = 0;
  const combined = salt + password;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `tx_${Math.abs(hash).toString(16)}`;
}

// Initialize Storage: Noop (all operations load directly from MongoDB)
export function initStorage() {}

// Low-level Getters/Setters (stubs returning empty values to prevent any local storage persistence)
export function getStoredUsers(): UserProfile[] {
  return [];
}

export function saveStoredUsers(_users: UserProfile[]) {}

export function getStoredViajes(_userId: string): Viaje[] {
  return [];
}

export function saveStoredViajes(_viajes: Viaje[], _userId: string) {}

export function getStoredCombustible(_userId: string): GastoCombustible[] {
  return [];
}

export function saveStoredCombustible(_combustible: GastoCombustible[], _userId: string) {}

export function getStoredMantenimiento(_userId: string): Mantenimiento[] {
  return [];
}

export function saveStoredMantenimiento(_mantenimiento: Mantenimiento[], _userId: string) {}

export function getStoredAlertas(_userId: string): AlertNotification[] {
  return [];
}

export function saveStoredAlertas(_alertas: AlertNotification[], _userId: string) {}

export function getStoredMonotributo(_userId: string): MonotributoRecord[] {
  return [];
}

export function saveStoredMonotributo(_records: MonotributoRecord[], _userId: string) {}

export function getStoredSeguro(_userId: string): SeguroRecord[] {
  return [];
}

export function saveStoredSeguro(_records: SeguroRecord[], _userId: string) {}

export function getStoredPatente(_userId: string): PatenteRecord[] {
  return [];
}

export function saveStoredPatente(_records: PatenteRecord[], _userId: string) {}

// Date and Filtering Helpers (essential for dashboard calculations and view filtering)
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function isDateInCurrentWeek(dateStr: string, referenceDateStr?: string): boolean {
  const refDate = parseLocalDate(referenceDateStr || getTodayDateString());
  const targetDate = parseLocalDate(dateStr);
  
  const day = refDate.getDay();
  const diff = refDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  
  const startOfWeek = new Date(refDate);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);
  
  return targetDate >= startOfWeek && targetDate <= endOfWeek;
}

export function filterByRange<T extends { fecha: string }>(
  items: T[], 
  range: FilterRange, 
  customDateStr?: string
): T[] {
  const refDate = parseLocalDate(customDateStr || getTodayDateString());
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth(); // 0-indexed
  const refDay = refDate.getDate();

  return items.filter(item => {
    const itemDate = parseLocalDate(item.fecha);
    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();
    const itemDay = itemDate.getDate();

    if (range === 'dia') {
      return itemYear === refYear && itemMonth === refMonth && itemDay === refDay;
    } else if (range === 'semana') {
      return isDateInCurrentWeek(item.fecha, customDateStr || getTodayDateString());
    } else if (range === 'mes') {
      return itemYear === refYear && itemMonth === refMonth;
    } else if (range === 'ano') {
      return itemYear === refYear;
    }
    return true; // 'todos'
  });
}

// Stat Calculations for Dashboard
export interface SummaryStats {
  ingresosTotales: number;
  gastosGNC: number;
  gastosNafta: number;
  gastosMantenimiento: number;
  gastosTotales: number;
  gananciaNeta: number;
  cantViajes: number;
  cantCargasGNC: number;
  cantCargasNafta: number;
  promedioViaje: number;
}

export function calculateSummary(
  viajes: Viaje[], 
  combustibles: GastoCombustible[], 
  mantenimientos: Mantenimiento[]
): SummaryStats {
  const ingresosTotales = viajes.reduce((sum, v) => sum + v.monto, 0);
  
  const gastosGNC = combustibles
    .filter(c => c.tipo === 'GNC')
    .reduce((sum, c) => sum + c.importe, 0);
    
  const gastosNafta = combustibles
    .filter(c => c.tipo === 'Nafta')
    .reduce((sum, c) => sum + c.importe, 0);

  const gastosMantenimiento = mantenimientos.reduce((sum, m) => sum + m.importe, 0);
  const gastosTotales = gastosGNC + gastosNafta + gastosMantenimiento;
  const gananciaNeta = ingresosTotales - gastosTotales;
  
  const cantViajes = viajes.length;
  const cantCargasGNC = combustibles.filter(c => c.tipo === 'GNC').length;
  const cantCargasNafta = combustibles.filter(c => c.tipo === 'Nafta').length;
  const promedioViaje = cantViajes > 0 ? ingresosTotales / cantViajes : 0;

  return {
    ingresosTotales,
    gastosGNC,
    gastosNafta,
    gastosMantenimiento,
    gastosTotales,
    gananciaNeta,
    cantViajes,
    cantCargasGNC,
    cantCargasNafta,
    promedioViaje
  };
}
