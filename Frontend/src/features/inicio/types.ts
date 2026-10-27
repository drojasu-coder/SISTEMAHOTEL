export interface AssetCreditInfo {
  autor: string;
  licencia: string;
  url: string;
  texto: string;
}

export interface InicioData {
  id: number;
  hero_titulo: string;
  hero_subtitulo: string;
  hero_imagen_key: string | null;
  hero_imagen_url: string | null;
  hero_imagen_alt: string;
  hero_imagen_creditos: AssetCreditInfo | null;
  hero_cta_texto: string;
  hero_cta_enlace: string;

  presentacion_titulo: string;
  presentacion_texto: string;
  presentacion_imagen_key: string | null;
  presentacion_imagen_url: string | null;
  presentacion_imagen_alt: string;
  presentacion_imagen_creditos: AssetCreditInfo | null;
  presentacion_visible: boolean;

  sedes_titulo: string;
  sedes_subtitulo: string;
  sedes_visible: boolean;

  experiencias_titulo: string;
  experiencias_subtitulo: string;
  experiencias_imagen_key: string | null;
  experiencias_imagen_url: string | null;
  experiencias_imagen_alt: string;
  experiencias_imagen_creditos: AssetCreditInfo | null;
  experiencias_visible: boolean;

  contacto_titulo: string;
  contacto_texto: string;
  contacto_telefono: string;
  contacto_email: string;
  contacto_direccion: string;
  contacto_visible: boolean;

  expiresAt?: string | null;
  updatedAt?: string;
}

export type UpdateInicioInput = Partial<
  Omit<
    InicioData,
    | 'id'
    | 'hero_imagen_url'
    | 'hero_imagen_creditos'
    | 'presentacion_imagen_url'
    | 'presentacion_imagen_creditos'
    | 'experiencias_imagen_url'
    | 'experiencias_imagen_creditos'
    | 'expiresAt'
    | 'updatedAt'
  >
>;
