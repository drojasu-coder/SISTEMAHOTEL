import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, CalendarClock, Truck, CarFront } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyRecords, OperationsState, OperationsTitle, StatusPill } from '@/features/operaciones/OperationsUI';
import { operacionesApi, fechaCorta } from '@/features/operaciones/operacionesApi';

type Seccion = 'empleados' | 'turnos' | 'choferes' | 'vehiculos';
const secciones: Array<{ id: Seccion; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id:'empleados',title:'Empleados',icon:Users },{ id:'turnos',title:'Turnos',icon:CalendarClock },{ id:'choferes',title:'Choferes',icon:Truck },{ id:'vehiculos',title:'Vehículos',icon:CarFront },
];

export const PersonalPage: React.FC = () => {
  const [seccion, setSeccion] = useState<Seccion>('empleados');
  const [search, setSearch] = useState('');
  const empleados = useQuery({queryKey:['admin','empleados'],queryFn:operacionesApi.empleados,enabled:seccion==='empleados'});
  const turnos = useQuery({queryKey:['admin','turnos'],queryFn:operacionesApi.turnos,enabled:seccion==='turnos'});
  const choferes = useQuery({queryKey:['admin','choferes'],queryFn:operacionesApi.choferes,enabled:seccion==='choferes'});
  const vehiculos = useQuery({queryKey:['admin','vehiculos'],queryFn:operacionesApi.vehiculos,enabled:seccion==='vehiculos'});
  const current = seccion==='empleados'?empleados:seccion==='turnos'?turnos:seccion==='choferes'?choferes:vehiculos;
  const registros = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (seccion==='empleados') return (empleados.data??[]).map(e=>({key:e.id,title:e.Usuario?.nombre||`Empleado #${e.id}`,meta:`${e.area} · ${e.Sucursal?.nombre||`Sede #${e.sucursal_id}`} · Usuario #${e.usuario_id}`,extra:e.fecha_contratacion?`Contratación: ${fechaCorta(e.fecha_contratacion)}`:''})).filter(e=>`${e.title} ${e.meta}`.toLowerCase().includes(term));
    if (seccion==='turnos') return (turnos.data??[]).map(t=>({key:t.id,title:`Turno #${t.id}`,meta:`Empleado #${t.empleado_id} · ${fechaCorta(t.fecha)}`,extra:`${t.hora_inicio.slice(0,5)}–${t.hora_fin.slice(0,5)}`})).filter(t=>`${t.title} ${t.meta}`.toLowerCase().includes(term));
    if (seccion==='choferes') return (choferes.data??[]).map(c=>({key:c.id,title:c.nombre,meta:`Licencia: ${c.licencia||'Sin registrar'}`,extra:c.activo?'Activo':'Inactivo'})).filter(c=>`${c.title} ${c.meta} ${c.extra}`.toLowerCase().includes(term));
    return (vehiculos.data??[]).map(v=>({key:v.id,title:v.tipo,meta:`Placa: ${v.placa||'Sin registrar'}`,extra:`Capacidad: ${v.capacidad} personas`})).filter(v=>`${v.title} ${v.meta}`.toLowerCase().includes(term));
  },[search,seccion,empleados.data,turnos.data,choferes.data,vehiculos.data]);
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
    <OperationsTitle overline="Operación hotelera" title="Personal y transporte" description="Consulta centralizada de empleados, horarios, choferes y vehículos registrados.">
      <Button variant="secondary" onClick={() => void current.refetch()}>Actualizar</Button>
    </OperationsTitle>
    <div role="tablist" aria-label="Secciones de personal" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{secciones.map(s=><button key={s.id} type="button" role="tab" aria-selected={seccion===s.id} onClick={()=>{setSeccion(s.id);setSearch('');}} className={`flex min-h-16 items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition-colors ${seccion===s.id?'border-selva-500 bg-selva-50 text-selva-900':'border-neutro-200 bg-white text-neutro-700 hover:bg-neutro-50'}`}><s.icon className="size-5 shrink-0"/>{s.title}</button>)}</div>
    <Card className="flex flex-wrap items-center gap-4 p-4"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-4 text-neutro-400"/><input aria-label="Buscar registros de personal" className="field-control pl-10" placeholder="Buscar en esta sección" value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="text-xs text-neutro-500">{registros.length} registros</span></Card>
    <OperationsState loading={current.isPending} error={current.error} retry={()=>void current.refetch()}/>
    {!current.isPending&&!current.isError&&(registros.length===0?<EmptyRecords message="No hay registros en esta sección o con la búsqueda indicada."/>:<div role="tabpanel" className="grid gap-3 md:grid-cols-2">{registros.map(r=><Card className="space-y-2 p-5" key={r.key}><div className="flex items-start justify-between gap-3"><h2 className="font-serif text-lg font-semibold text-neutro-900">{r.title}</h2>{seccion==='choferes'?<StatusPill value={r.extra}/>:<span className="text-xs text-neutro-400">#{r.key}</span>}</div><p className="text-sm text-neutro-600">{r.meta}</p>{seccion!=='choferes'&&r.extra&&<p className="text-xs font-semibold text-bronce-700">{r.extra}</p>}</Card>)}</div>)}
    <p className="text-xs text-neutro-500">Vista de seguimiento conectada al backend. Altas, cambios y bajas de personal requieren pruebas adicionales de permisos y reglas de negocio antes de habilitarse en esta versión.</p>
  </div>;
};
