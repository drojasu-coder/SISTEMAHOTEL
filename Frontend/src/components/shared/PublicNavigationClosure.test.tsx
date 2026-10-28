import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { renderPublicWithProviders, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { ContactoSection } from '@/features/inicio/components/ContactoSection';
import { Footer } from './Footer';
import { PublicSedesPage } from '@/pages/PublicSedesPage';
import { HomePage } from '@/pages/HomePage';
import { inicioApi } from '@/features/inicio/api/inicioApi';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import type { InicioData } from '@/features/inicio/types';
import userEvent from '@testing-library/user-event';

const initialContact = { contacto_visible: true, contacto_titulo: 'Información y Reservas', contacto_texto: 'Información del hotel.', contacto_telefono: '+502 2222-3333', contacto_email: 'reservas@hotelhunapu.com', contacto_direccion: 'Guatemala, Centroamérica' } as InicioData;
const configured = { ...initialContact, contacto_telefono: '77620015', contacto_email: 'recepcion@hotel.com.gt', contacto_direccion: 'Dirección publicada de la sede' };
const sites = [
  { id: 1, nombre: 'Hotel Hunahpú Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: '22223333', activa: true },
  { id: 2, nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Panajachel', direccion: 'Dirección configurada', telefono: '77620015', activa: true },
];
const mount = (ui: React.ReactElement, route='/') => renderPublicWithProviders(<LocaleProvider>{ui}</LocaleProvider>, {route});
beforeEach(()=>{localStorage.clear();sessionStorage.clear();tokenStorage.clear();localStorage.setItem('hunahpu.public-site.v1','all');vi.spyOn(sedesApi,'getAll').mockResolvedValue(sites);vi.spyOn(inicioApi,'getContent').mockResolvedValue(initialContact);global.fetch=vi.fn(async()=>jsonResponse({data:[]}));});
afterEach(()=>{vi.restoreAllMocks();tokenStorage.clear();});
describe('Navegación y contacto públicos',()=>{
  it('conserva los contactos de referencia aprobados sin sustituirlos por otros',()=>{
    mount(<ContactoSection data={initialContact}/>);
    expect(screen.getByRole('link',{name:'+502 2222-3333'})).toHaveAttribute('href','tel:+50222223333');
    expect(screen.getByRole('link',{name:'reservas@hotelhunapu.com'})).toHaveAttribute('href','mailto:reservas@hotelhunapu.com');
    expect(screen.getByText('Guatemala, Centroamérica')).toBeInTheDocument();
  });
  it('conserva contactos configurados distintos de los ejemplos con enlaces válidos y prefijo del país',()=>{
    mount(<ContactoSection data={configured}/>);
    expect(screen.getByRole('link',{name:'+502 7762-0015'})).toHaveAttribute('href','tel:+50277620015');
    expect(screen.getByRole('link',{name:'recepcion@hotel.com.gt'})).toHaveAttribute('href','mailto:recepcion@hotel.com.gt');
    expect(screen.getByText('Dirección publicada de la sede')).toBeInTheDocument();
  });
  it('no muestra tarjetas vacías ni enlaces tel/mailto inválidos',()=>{
    mount(<ContactoSection data={{...initialContact,contacto_telefono:'No disponible',contacto_email:'desconocido',contacto_direccion:''}}/>);
    expect(screen.queryByRole('link',{name:'No disponible'})).not.toBeInTheDocument();
    expect(document.querySelector('a[href="tel:"],a[href="mailto:desconocido"]')).toBeNull();
  });
  it('mantiene contacto oculto cuando la configuración así lo indica',()=>{
    mount(<ContactoSection data={{...configured,contacto_visible:false}}/>);
    expect(screen.queryByRole('region',{name:'Información y Contacto'})).not.toBeInTheDocument();
    expect(screen.queryByRole('link',{name:'recepcion@hotel.com.gt'})).not.toBeInTheDocument();
  });
  it('el footer dirige a Contacto, publica una vez el correo aprobado y conserva teléfonos por sede',async()=>{
    vi.mocked(inicioApi.getContent).mockResolvedValue(configured);
    mount(<Footer/>);const footer=screen.getByRole('contentinfo');
    expect(await within(footer).findByRole('link',{name:'Contacto'})).toHaveAttribute('href','/#contacto');
    expect(within(footer).getAllByRole('link',{name:'recepcion@hotel.com.gt'})).toHaveLength(1);
    expect(within(footer).getByRole('link',{name:'+502 2222-3333'})).toHaveAttribute('href','tel:+50222223333');
    expect(within(footer).getByRole('link',{name:'+502 7762-0015'})).toHaveAttribute('href','tel:+50277620015');
  });
  it('Sedes conserva los teléfonos aprobados y la dirección configurada',async()=>{
    mount(<PublicSedesPage/>,'/sedes');
    await screen.findByRole('heading',{name:'Hotel Hunahpú Antigua'});
    expect(screen.getByRole('link',{name:'+502 2222-3333'})).toHaveAttribute('href','tel:+50222223333');
    expect(screen.getByRole('link',{name:'+502 7762-0015'})).toHaveAttribute('href','tel:+50277620015');
    expect(screen.getByText(/Dirección configurada/)).toBeInTheDocument();
  });
  it('el acceso por hash enfoca y desplaza la sección real tras cargar Inicio',async()=>{
    const scroll=vi.fn();vi.stubGlobal('scrollTo',vi.fn());const old=HTMLElement.prototype.scrollIntoView;HTMLElement.prototype.scrollIntoView=scroll;
    try{mount(<HomePage/>,'/#contacto');await waitFor(()=>expect(document.activeElement).toBe(document.getElementById('contacto')));expect(scroll).toHaveBeenCalled();}finally{HTMLElement.prototype.scrollIntoView=old;vi.unstubAllGlobals();}
  });
  it('traduce los accesos de contacto sin alterar los datos publicados',async()=>{
    mount(<><LanguageSelector/><ContactoSection data={configured}/><Footer/></>);
    await userEvent.setup().selectOptions(screen.getByRole('combobox',{name:'Idioma'}),'en');
    expect(await within(screen.getByRole('contentinfo')).findByRole('link',{name:'Contact'})).toHaveAttribute('href','/#contacto');
    expect(within(screen.getByRole('region',{name:'Information and contact'})).getByRole('link',{name:'recepcion@hotel.com.gt'})).toHaveAttribute('href','mailto:recepcion@hotel.com.gt');
  });
});
