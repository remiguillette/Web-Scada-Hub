import { Monitor, Power, ShieldAlert, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusIcon({
  icon,
  activeColor,
  inactiveColor = 'text-[#475569]',
  active,
}: {
  icon: 'power' | 'shield' | 'zap' | 'monitor';
  activeColor: string;
  inactiveColor?: string;
  active: boolean;
}) {
  const className = cn('h-4 w-4', active ? activeColor : inactiveColor);

  switch (icon) {
    case 'power':
      return <Power className={className} />;
    case 'shield':
      return <ShieldAlert className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'monitor':
      return <Monitor className={className} />;
    default:
      return null;
  }
}
