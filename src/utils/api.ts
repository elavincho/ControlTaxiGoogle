import { UserProfile, Viaje, GastoCombustible, Mantenimiento, AlertNotification, MonotributoRecord, SeguroRecord } from '../types';

let isMongoConnected = false;

// Determine if MongoDB is connected on the server
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Unreachable');
    const data = await res.json();
    isMongoConnected = data.status === 'ok' && data.mongodb === 'connected';
  } catch (e) {
    isMongoConnected = false;
  }
  return isMongoConnected;
}

// Check on module load
checkDatabaseConnection();

// Helper to throw detailed fetch errors
async function handleResponse(res: Response, defaultErrorMsg: string) {
  if (!res.ok) {
    let errorMsg = defaultErrorMsg;
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch (e) {
      // JSON parsing failed, use default message
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

// --- AUTHENTICATION & PROFILE ---

export async function loginUser(identifier: string, passwordHash: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, passwordHash })
  });
  const user = await handleResponse(res, 'Credenciales inválidas o error de conexión con la base de datos.');
  if (user && user._id) {
    user.id = user._id;
  }
  return user;
}

export async function registerUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const user = await handleResponse(res, 'Error al registrar chofer en la base de datos.');
  if (user && user._id) {
    user.id = user._id;
  }
  return user;
}

export async function updateUserProfile(userId: string, updatedFields: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields)
  });
  const user = await handleResponse(res, 'Error al actualizar el perfil en la base de datos.');
  if (user && user._id) {
    user.id = user._id;
  }
  return user;
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'DELETE'
  });
  await handleResponse(res, 'Error al eliminar el usuario de la base de datos.');
  return true;
}

// --- VIAJES ---

export async function getViajes(userId: string): Promise<Viaje[]> {
  const res = await fetch(`/api/viajes/${userId}`);
  const list = await handleResponse(res, 'Error al cargar viajes de la base de datos.');
  return list.map((v: any) => ({ ...v, id: v._id }));
}

export async function saveViaje(viajeData: Omit<Viaje, 'id'>): Promise<Viaje> {
  const res = await fetch('/api/viajes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(viajeData)
  });
  const created = await handleResponse(res, 'Error al guardar el viaje en la base de datos.');
  return { ...created, id: created._id };
}

export async function updateViaje(id: string, viajeData: Partial<Viaje>, _userId: string): Promise<Viaje> {
  const res = await fetch(`/api/viajes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(viajeData)
  });
  const updated = await handleResponse(res, 'Error al actualizar el viaje en la base de datos.');
  return { ...updated, id: updated._id };
}

export async function deleteViaje(id: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/viajes/${id}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar el viaje de la base de datos.');
  return true;
}

// --- COMBUSTIBLE ---

export async function getCombustible(userId: string): Promise<GastoCombustible[]> {
  const res = await fetch(`/api/combustible/${userId}`);
  const list = await handleResponse(res, 'Error al cargar gastos de combustible.');
  return list.map((c: any) => ({ ...c, id: c._id }));
}

export async function saveCombustible(cargaData: Omit<GastoCombustible, 'id'>): Promise<GastoCombustible> {
  const res = await fetch('/api/combustible', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cargaData)
  });
  const created = await handleResponse(res, 'Error al guardar la carga en la base de datos.');
  return { ...created, id: created._id };
}

export async function updateCombustible(id: string, cargaData: Partial<GastoCombustible>, _userId: string): Promise<GastoCombustible> {
  const res = await fetch(`/api/combustible/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cargaData)
  });
  const updated = await handleResponse(res, 'Error al actualizar la carga de combustible.');
  return { ...updated, id: updated._id };
}

export async function deleteCombustible(id: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/combustible/${id}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar la carga de combustible.');
  return true;
}

// --- MANTENIMIENTO ---

export async function getMantenimiento(userId: string): Promise<Mantenimiento[]> {
  const res = await fetch(`/api/mantenimiento/${userId}`);
  const list = await handleResponse(res, 'Error al cargar mantenimientos de la base de datos.');
  return list.map((m: any) => ({ ...m, id: m._id }));
}

export async function saveMantenimiento(maintData: Omit<Mantenimiento, 'id'>): Promise<Mantenimiento> {
  const res = await fetch('/api/mantenimiento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(maintData)
  });
  const created = await handleResponse(res, 'Error al guardar mantenimiento en la base de datos.');
  return { ...created, id: created._id };
}

export async function updateMantenimiento(id: string, maintData: Partial<Mantenimiento>, _userId: string): Promise<Mantenimiento> {
  const res = await fetch(`/api/mantenimiento/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(maintData)
  });
  const updated = await handleResponse(res, 'Error al actualizar el mantenimiento.');
  return { ...updated, id: updated._id };
}

export async function deleteMantenimiento(id: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/mantenimiento/${id}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar el mantenimiento.');
  return true;
}

// --- MONOTRIBUTO ---

export async function getMonotributo(userId: string): Promise<MonotributoRecord[]> {
  const res = await fetch(`/api/monotributo/${userId}`);
  const list = await handleResponse(res, 'Error al cargar registros de monotributo.');
  return list.map((m: any) => ({ ...m, id: m._id }));
}

export async function saveMonotributo(recordData: Omit<MonotributoRecord, 'id'>): Promise<MonotributoRecord> {
  const res = await fetch('/api/monotributo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData)
  });
  const created = await handleResponse(res, 'Error al guardar registro de monotributo.');
  return { ...created, id: created._id };
}

export async function updateMonotributo(id: string, recordData: Partial<MonotributoRecord>, _userId: string): Promise<MonotributoRecord> {
  const res = await fetch(`/api/monotributo/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData)
  });
  const updated = await handleResponse(res, 'Error al actualizar el registro de monotributo.');
  return { ...updated, id: updated._id };
}

export async function deleteMonotributo(id: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/monotributo/${id}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar el registro de monotributo.');
  return true;
}

// --- SEGURO ---

export async function getSeguro(userId: string): Promise<SeguroRecord[]> {
  const res = await fetch(`/api/seguro/${userId}`);
  const list = await handleResponse(res, 'Error al cargar registros de seguro.');
  return list.map((s: any) => ({ ...s, id: s._id }));
}

export async function saveSeguro(recordData: Omit<SeguroRecord, 'id'>): Promise<SeguroRecord> {
  const res = await fetch('/api/seguro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData)
  });
  const created = await handleResponse(res, 'Error al guardar el registro de seguro.');
  return { ...created, id: created._id };
}

export async function updateSeguro(id: string, recordData: Partial<SeguroRecord>, _userId: string): Promise<SeguroRecord> {
  const res = await fetch(`/api/seguro/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData)
  });
  const updated = await handleResponse(res, 'Error al actualizar el registro de seguro.');
  return { ...updated, id: updated._id };
}

export async function deleteSeguro(id: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/seguro/${id}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar el registro de seguro.');
  return true;
}

// --- ALERTAS ---

export async function getAlertas(userId: string): Promise<AlertNotification[]> {
  const res = await fetch(`/api/alertas/${userId}`);
  const list = await handleResponse(res, 'Error al cargar alertas de la base de datos.');
  return list.map((a: any) => ({ ...a, id: a._id }));
}

export async function saveAlerta(alertaData: Omit<AlertNotification, 'id'>): Promise<AlertNotification> {
  const res = await fetch('/api/alertas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertaData)
  });
  const created = await handleResponse(res, 'Error al guardar la alerta en la base de datos.');
  return { ...created, id: created._id };
}

export async function updateAlerta(alertaId: string, updatedFields: Partial<AlertNotification>, _userId: string): Promise<AlertNotification> {
  const res = await fetch(`/api/alertas/${alertaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields)
  });
  const updated = await handleResponse(res, 'Error al actualizar la alerta.');
  return { ...updated, id: updated._id };
}

export async function deleteAlerta(alertaId: string, _userId: string): Promise<boolean> {
  const res = await fetch(`/api/alertas/${alertaId}`, { method: 'DELETE' });
  await handleResponse(res, 'Error al eliminar la alerta de la base de datos.');
  return true;
}
