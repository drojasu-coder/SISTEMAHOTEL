import React from 'react';
import {
  BedDouble,
  CalendarCheck,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { env } from '@/app/config/env';

export const AdminPage: React.FC = () => {
  const metricCards = [
    { label: 'Ocupación Actual', value: '78%', sub: 'Sede Antigua + Atitlán', icon: BedDouble },
    { label: 'Reservas del Día', value: '24', sub: 'Habitaciones y salones', icon: CalendarCheck },
    { label: 'Ingresos Facturados', value: 'Q18,450.00', sub: 'Total consolidado', icon: CreditCard },
    { label: 'Personal en Turno', value: '16', sub: 'Activos en horario diurno', icon: Users },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white border border-charcoal-200/80 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-semibold text-charcoal-900 tracking-tight">
            Panel de Control Administrativo — Hotel Hunapú
          </h1>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            Vista base de administración. Conexión configurada hacia API Backend:{' '}
            <code className="px-1.5 py-0.5 rounded bg-cream-100 font-mono text-bronze-700 font-semibold break-all">
              {env.apiBaseUrl}
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-success-bg text-status-success">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Sistema Operativo</span>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-charcoal-700">{card.label}</span>
                <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-bronze-700 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-charcoal-900 mt-2">{card.value}</p>
              <p className="text-[11px] text-charcoal-400 mt-1">{card.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Technical Architecture Status Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-charcoal-900 mb-4">
          <Activity className="w-4 h-4 text-bronze-700 shrink-0" />
          <span>Infraestructura y Contratos Frontend (Fase 6A)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-4 rounded-xl bg-cream-50 border border-charcoal-200/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-charcoal-900">
              <Layers className="w-4 h-4 text-bronze-700 shrink-0" />
              <span>Contrato OpenAPI</span>
            </div>
            <p className="text-charcoal-700 leading-relaxed">
              Tipos TypeScript autogenerados sincronizados con 93 paths y 184 operaciones de Swagger.
            </p>
            <span className="inline-block px-2 py-0.5 rounded bg-cream-100 text-[10px] font-mono text-bronze-700 font-bold break-all">
              src/api/generated/schema.ts
            </span>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-charcoal-200/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-charcoal-900">
              <Clock className="w-4 h-4 text-bronze-700 shrink-0" />
              <span>TanStack Query</span>
            </div>
            <p className="text-charcoal-700 leading-relaxed">
              QueryClient global configurado para caché, invalidación y mutaciones en siguientes fases.
            </p>
            <span className="inline-block px-2 py-0.5 rounded bg-cream-100 text-[10px] font-mono text-bronze-700 font-bold break-all">
              QueryClientProvider activo
            </span>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-charcoal-200/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-charcoal-900">
              <CheckCircle2 className="w-4 h-4 text-bronze-700 shrink-0" />
              <span>Cliente HTTP Nativo</span>
            </div>
            <p className="text-charcoal-700 leading-relaxed">
              Cliente fetch con manejo unificado de errores ApiError, JSON parsing y soporte para Authorization Bearer.
            </p>
            <span className="inline-block px-2 py-0.5 rounded bg-cream-100 text-[10px] font-mono text-bronze-700 font-bold break-all">
              src/api/client/http.ts
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
