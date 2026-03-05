// utils/dateFormatters.js


export const formatearFechaLocal = (fechaUTC, incluirHora = true) => {
  if (!fechaUTC) return '';
  
  const fecha = new Date(fechaUTC + 'Z');
  
  const opciones = {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  };
  
  if (incluirHora) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
    opciones.hour12 = false;
  }
  
  return fecha.toLocaleString('es-AR', opciones);
};


export const formatearFecha = (fechaUTC) => {
  return formatearFechaLocal(fechaUTC, false);
};


export const formatearFechaHora = (fechaUTC) => {
  return formatearFechaLocal(fechaUTC, true);
};