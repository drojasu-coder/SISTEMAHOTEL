import { Check, ChevronDown, Globe, MapPin, Menu, User, LogOut, Calendar, LayoutDashboard, Flower2, Dumbbell, Sparkles, PartyPopper, ShoppingCart, Route } from 'lucide-react';
import { cn } from '@/lib/cn';
const icons = { check: Check, abajo: ChevronDown, globo: Globe, ubicacion: MapPin, menu: Menu, persona: User, salir: LogOut, calendario: Calendar, panel: LayoutDashboard, bienestar: Flower2, actividad: Dumbbell, amenidad: Sparkles, evento: PartyPopper, carrito: ShoppingCart, viaje: Route };
export type IconName = keyof typeof icons;
export function Icon({ name, className }: { name: IconName; className?: string }) {
  const Component = icons[name];
  return <Component aria-hidden="true" focusable="false" strokeWidth={1.75} className={cn('size-5 shrink-0', className)} />;
}
