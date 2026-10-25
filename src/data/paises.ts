// ==============================================================================
// LISTADO DE PAÍSES Y GENTILICIOS CON BANDERAS PARA EL SAGH
// ==============================================================================

export interface Pais {
  codigo: string;
  nombre: string;
  gentilicio: string;
  bandera: string;
}

export const PAISES: Pais[] = [
  // Países prioritarios (Sudamérica y principales)
  { codigo: 'BO', nombre: 'Bolivia', gentilicio: 'Boliviana', bandera: '🇧🇴' },
  { codigo: 'AR', nombre: 'Argentina', gentilicio: 'Argentina', bandera: '🇦🇷' },
  { codigo: 'BR', nombre: 'Brasil', gentilicio: 'Brasileña', bandera: '🇧🇷' },
  { codigo: 'CL', nombre: 'Chile', gentilicio: 'Chilena', bandera: '🇨🇱' },
  { codigo: 'CO', nombre: 'Colombia', gentilicio: 'Colombiana', bandera: '🇨🇴' },
  { codigo: 'PE', nombre: 'Perú', gentilicio: 'Peruana', bandera: '🇵🇪' },
  { codigo: 'PY', nombre: 'Paraguay', gentilicio: 'Paraguaya', bandera: '🇵🇾' },
  { codigo: 'UY', nombre: 'Uruguay', gentilicio: 'Uruguaya', bandera: '🇺🇾' },
  { codigo: 'EC', nombre: 'Ecuador', gentilicio: 'Ecuatoriana', bandera: '🇪🇨' },
  { codigo: 'VE', nombre: 'Venezuela', gentilicio: 'Venezolana', bandera: '🇻🇪' },
  
  // Norteamérica y Centroamérica
  { codigo: 'MX', nombre: 'México', gentilicio: 'Mexicana', bandera: '🇲🇽' },
  { codigo: 'US', nombre: 'Estados Unidos', gentilicio: 'Estadounidense', bandera: '🇺🇸' },
  { codigo: 'CA', nombre: 'Canadá', gentilicio: 'Canadiense', bandera: '🇨🇦' },
  { codigo: 'PA', nombre: 'Panamá', gentilicio: 'Panameña', bandera: '🇵🇦' },
  { codigo: 'CR', nombre: 'Costa Rica', gentilicio: 'Costarricense', bandera: '🇨🇷' },
  { codigo: 'DO', nombre: 'República Dominicana', gentilicio: 'Dominicana', bandera: '🇩🇴' },
  { codigo: 'CU', nombre: 'Cuba', gentilicio: 'Cubana', bandera: '🇨🇺' },

  // Europa y resto del mundo
  { codigo: 'ES', nombre: 'España', gentilicio: 'Española', bandera: '🇪🇸' },
  { codigo: 'FR', nombre: 'Francia', gentilicio: 'Francesa', bandera: '🇫🇷' },
  { codigo: 'IT', nombre: 'Italia', gentilicio: 'Italiana', bandera: '🇮🇹' },
  { codigo: 'DE', nombre: 'Alemania', gentilicio: 'Alemana', bandera: '🇩🇪' },
  { codigo: 'GB', nombre: 'Reino Unido', gentilicio: 'Británica', bandera: '🇬🇧' },
  { codigo: 'CH', nombre: 'Suiza', gentilicio: 'Suiza', bandera: '🇨🇭' },
  { codigo: 'PT', nombre: 'Portugal', gentilicio: 'Portuguesa', bandera: '🇵🇹' },
  { codigo: 'CN', nombre: 'China', gentilicio: 'China', bandera: '🇨🇳' },
  { codigo: 'JP', nombre: 'Japón', gentilicio: 'Japonesa', bandera: '🇯🇵' },
  { codigo: 'KR', nombre: 'Corea del Sur', gentilicio: 'Surcoreana', bandera: '🇰🇷' },
  { codigo: 'AU', nombre: 'Australia', gentilicio: 'Australiana', bandera: '🇦🇺' },
];
