import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renderiza un span oculto a tecnologías de asistencia con fondo neutro', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('span');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton?.getAttribute('class')).toContain('bg-neutro-200');
    expect(skeleton?.getAttribute('class')).toContain('animate-pulse');
  });

  it('acepta una altura personalizada', () => {
    const { container } = render(<Skeleton height="h-16" />);
    const skeleton = container.querySelector('span');
    expect(skeleton?.getAttribute('class')).toContain('h-16');
  });
});
