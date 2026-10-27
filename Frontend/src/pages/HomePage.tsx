import React from 'react';
import { useInicioQuery } from '@/features/inicio/hooks/useInicio';
import { HeroSection } from '@/features/inicio/components/HeroSection';
import { BuscadorDisponibilidad } from '@/features/inicio/components/BuscadorDisponibilidad';
import { PresentacionSection } from '@/features/inicio/components/PresentacionSection';
import { SedesSection } from '@/features/inicio/components/SedesSection';
import { ExperienciasSection } from '@/features/inicio/components/ExperienciasSection';
import { ContactoSection } from '@/features/inicio/components/ContactoSection';
import type { InicioData } from '@/features/inicio/types';

const DEFAULT_INICIO_DATA: InicioData = {
  id: 1,
  hero_titulo: 'HOTEL HUNAHPÚ',
  hero_subtitulo:
    'Hospedaje de distinción, gastronomía y bienestar en los destinos más emblemáticos de Guatemala.',
  hero_imagen_key: 'branding/inicio/hero-portada-1793003000001.webp',
  hero_imagen_url: null,
  hero_imagen_alt: 'Vista panorámica de HOTEL HUNAHPÚ en Guatemala',
  hero_imagen_creditos: {
    autor: 'Mark Harpur',
    licencia: 'Unsplash',
    url: 'https://unsplash.com/photos/K2s_YE031CA',
    texto: 'Mark Harpur (Unsplash)',
  },
  hero_cta_texto: 'Reservar estancia',
  hero_cta_enlace: '/crear-reserva',

  presentacion_titulo: 'Hospitalidad con identidad y excelencia',
  presentacion_texto:
    'En HOTEL HUNAHPÚ fusionamos el confort contemporáneo con la riqueza cultural y natural de Guatemala. Nuestras cuatro sedes en Antigua Guatemala, Lago de Atitlán, Quetzaltenango y Ciudad de Guatemala ofrecen experiencias inolvidables concebidas para el descanso, los negocios y la celebración.',
  presentacion_imagen_key: 'branding/inicio/presentacion-hotel-1793003000002.webp',
  presentacion_imagen_url: null,
  presentacion_imagen_alt: 'Arquitectura y hospitalidad de HOTEL HUNAHPÚ',
  presentacion_imagen_creditos: {
    autor: 'mana5280',
    licencia: 'Unsplash',
    url: 'https://unsplash.com/photos/ef09feed7fd7',
    texto: 'mana5280 (Unsplash)',
  },
  presentacion_visible: true,

  sedes_titulo: 'Nuestras Sedes',
  sedes_subtitulo:
    'Cuatro destinos únicos diseñados para conectar con la belleza y serenidad de Guatemala.',
  sedes_visible: true,

  experiencias_titulo: 'Servicios y Experiencias',
  experiencias_subtitulo:
    'Gastronomía refinada, bienestar integral, actividades recreativas y salones para eventos memorables.',
  experiencias_imagen_key: 'branding/inicio/experiencias-servicios-1793003000003.webp',
  experiencias_imagen_url: null,
  experiencias_imagen_alt: 'Experiencias de hospitalidad y descanso en HOTEL HUNAHPÚ',
  experiencias_imagen_creditos: {
    autor: 'Roberto Nickson',
    licencia: 'Unsplash',
    url: 'https://unsplash.com/photos/photo-1532302584927-8bd4b6118390',
    texto: 'Roberto Nickson (Unsplash)',
  },
  experiencias_visible: true,

  contacto_titulo: 'Información y Reservas',
  contacto_texto:
    'Estamos a su disposición para coordinar su estancia, eventos y experiencias personalizadas en cualquiera de nuestras sedes.',
  contacto_telefono: '+502 2222-3333',
  contacto_email: 'reservas@hotelhunapu.com',
  contacto_direccion: 'Guatemala, Centroamérica',
  contacto_visible: true,
};

export const HomePage: React.FC = () => {
  const { data } = useInicioQuery();

  const inicioData: InicioData = {
    ...DEFAULT_INICIO_DATA,
    ...(data && typeof data === "object" ? data : {}),
    hero_titulo: data?.hero_titulo || DEFAULT_INICIO_DATA.hero_titulo,
    hero_subtitulo: data?.hero_subtitulo || DEFAULT_INICIO_DATA.hero_subtitulo,
    hero_cta_texto: data?.hero_cta_texto || DEFAULT_INICIO_DATA.hero_cta_texto,
    hero_cta_enlace: data?.hero_cta_enlace || DEFAULT_INICIO_DATA.hero_cta_enlace,
  };


  return (
    <div className="flex w-full flex-col">
      {/* 1. Hero Banner Principal */}
      <HeroSection data={inicioData} />

      {/* 2. Buscador de Disponibilidad conectado en tiempo real */}
      <BuscadorDisponibilidad />

      {/* 3. Presentación e Identidad del Hotel */}
      <PresentacionSection data={inicioData} />

      {/* 4. Tarjetas de Nuestras 4 Sedes Oficiales */}
      <SedesSection data={inicioData} />

      {/* 5. Catálogo de Servicios & Experiencias */}
      <ExperienciasSection data={inicioData} />

      {/* 6. Información de Contacto Directo */}
      <ContactoSection data={inicioData} />
    </div>
  );
};
