export type LegalSlug = 'terminos' | 'privacidad' | 'reservas' | 'almacenamiento' | 'preguntas';

/** Un bloque es un párrafo o una lista; así el contenido se mantiene como datos traducibles. */
export type LegalBlock = { p: string; list?: never } | { list: string[]; p?: never };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  description: string;
  sections: LegalSection[];
}

export type LegalDocuments = Record<LegalSlug, LegalDocument>;
