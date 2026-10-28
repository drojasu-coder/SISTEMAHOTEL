import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { useTiposHabitacionTexts, formatGTQ } from "../textos";
import type { TipoHabitacion } from "../types";
import type { AdminSede } from "@/features/admin-core/hooks/useAdminSedes";

interface Props {
  tipos: TipoHabitacion[];
  canEdit: boolean;
  isEditable?: (tipo: TipoHabitacion) => boolean;
  sedes?: AdminSede[];
  onEdit: (tipo: TipoHabitacion) => void;
}
type Row = Omit<TipoHabitacion, 'id'> & { id: string; original: TipoHabitacion };
export function TiposHabitacionList({ tipos, canEdit, isEditable = () => canEdit, sedes = [], onEdit }: Props) {
  const text = useTiposHabitacionTexts();
  const site = (tipo: TipoHabitacion) => tipo.sucursal_id === null ? text.generalShort
    : sedes.find(sede => sede.id === tipo.sucursal_id)?.nombre ?? (tipo.sucursal_id ? 'Sede #' + tipo.sucursal_id : text.sedeDesconocida);
  const columns: Column<Row>[] = [
    { key: 'name', label: text.nombre, render: row => <div className="flex min-w-0 items-center gap-3">
      {row.imagen_url && <img src={row.imagen_url} alt={row.nombre} className="size-10 shrink-0 rounded-md object-cover" />}
      <span className="font-semibold">{row.nombre}</span>
    </div> },
    { key: 'site', label: text.sede, render: row => site(row.original) },
    { key: 'capacity', label: text.capacidadMaxima, render: row => text.personas(row.capacidad_maxima) },
    { key: 'rate', label: text.tarifaNoche, render: row => <span className="whitespace-nowrap tabular-nums">{formatGTQ(row.tarifa_noche)}</span> },
    { key: 'description', label: text.descripcionLabel, render: row => row.descripcion || '—' },
    ...(canEdit ? [{
      key: 'actions', label: text.acciones, render: (row: Row) => isEditable(row.original)
        ? <Button variant="ghost" size="sm" aria-label={text.editarNombre(row.nombre)} onClick={() => onEdit(row.original)}>{text.editar}</Button>
        : <span className="text-xs text-neutro-600">{row.sucursal_id === null ? text.readonly : text.sedeDesconocida}</span>,
    }] : []),
  ];
  return <Table rows={tipos.map(tipo => ({ ...tipo, id: String(tipo.id), original: tipo }))} columns={columns} caption={text.titulo} />;
}
