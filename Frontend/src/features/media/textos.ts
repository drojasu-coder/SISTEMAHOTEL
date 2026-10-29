import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la administración de identidad visual (ES/EN). */
const es = {
  categoria: 'Configuración', titulo: 'Identidad visual', intro: 'Logotipos de la marca que se muestran en el sitio y en el panel.',
  cargando: 'Cargando logotipos…', error: 'No fue posible consultar los logotipos.', reintentar: 'Reintentar',
  usoTitulo: 'Dónde se usa', actual: 'Publicado', nueva: 'Nueva selección', sinImagen: 'Sin logotipo publicado', sinUso: 'No se muestra actualmente en el sitio ni en el panel.',
  reemplazar: 'Reemplazar', elegir: 'Elegir archivo', cancelar: 'Cancelar selección', publicar: 'Publicar', publicando: 'Publicando…',
  formatos: 'SVG, PNG, JPEG o WebP · hasta 5 MiB', fondoClaro: 'Vista sobre fondo claro', fondoOscuro: 'Vista sobre fondo oscuro',
  confirmarTitulo: 'Publicar nuevo logotipo', confirmarDesc: (n: string) => `Reemplazará «${n}» en todo el sitio y el panel. El archivo actual deja de mostrarse.`, confirmar: 'Publicar logotipo', volver: 'Volver',
  ok: (n: string) => `«${n}» actualizado.`, errTipo: 'Formato no admitido. Use SVG, PNG, JPEG o WebP.', errTam: (mb: string) => `El archivo pesa ${mb} MiB y supera el límite de 5 MiB.`, errSubida: 'No fue posible publicar el logotipo. Intente de nuevo.',
  archivo: (n: string, kb: number) => `${n} · ${kb} KB`, noEditable: 'Los colores y tipografías de la marca no se configuran desde el panel.',
  variantes: {
    logoHorizontalColor: { nombre: 'Logotipo principal', desc: 'Versión a color para fondos claros.', usos: ['Encabezado del sitio público', 'Encabezado y menú del panel', 'Pantallas de acceso y registro'] },
    logoHorizontalBlanco: { nombre: 'Logotipo para fondos oscuros', desc: 'Versión en blanco para fondos oscuros o fotografías.', usos: ['Pie de página del sitio público'] },
    isotipoColor: { nombre: 'Isotipo', desc: 'Símbolo compacto de la marca.', usos: [] as string[] },
  },
};
const en: typeof es = {
  categoria: 'Configuration', titulo: 'Visual identity', intro: 'Brand logos shown on the website and in the admin panel.',
  cargando: 'Loading logos…', error: 'The logos could not be loaded.', reintentar: 'Retry',
  usoTitulo: 'Where it is used', actual: 'Published', nueva: 'New selection', sinImagen: 'No logo published', sinUso: 'Not currently shown on the website or in the panel.',
  reemplazar: 'Replace', elegir: 'Choose file', cancelar: 'Cancel selection', publicar: 'Publish', publicando: 'Publishing…',
  formatos: 'SVG, PNG, JPEG or WebP · up to 5 MiB', fondoClaro: 'Preview on light background', fondoOscuro: 'Preview on dark background',
  confirmarTitulo: 'Publish new logo', confirmarDesc: (n: string) => `It will replace “${n}” across the website and the panel. The current file stops being shown.`, confirmar: 'Publish logo', volver: 'Back',
  ok: (n: string) => `“${n}” updated.`, errTipo: 'Unsupported format. Use SVG, PNG, JPEG or WebP.', errTam: (mb: string) => `The file is ${mb} MiB and exceeds the 5 MiB limit.`, errSubida: 'The logo could not be published. Please try again.',
  archivo: (n: string, kb: number) => `${n} · ${kb} KB`, noEditable: 'Brand colors and typefaces are not configured from the panel.',
  variantes: {
    logoHorizontalColor: { nombre: 'Primary logo', desc: 'Color version for light backgrounds.', usos: ['Public website header', 'Panel header and menu', 'Sign-in and registration screens'] },
    logoHorizontalBlanco: { nombre: 'Logo for dark backgrounds', desc: 'White version for dark backgrounds or photographs.', usos: ['Public website footer'] },
    isotipoColor: { nombre: 'Symbol', desc: 'Compact brand symbol.', usos: [] as string[] },
  },
};
export const useTextosMarca = () => { const { locale } = useLocale(); return locale === 'en' ? en : es; };
