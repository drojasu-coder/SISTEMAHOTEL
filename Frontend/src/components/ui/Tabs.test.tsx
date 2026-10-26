import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('renderiza tablist con aria-selected y tabpanel asociado', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { id: 'a', label: 'Detalle', content: <p>Contenido A</p> },
          { id: 'b', label: 'Opciones', content: <p>Contenido B</p> },
        ]}
        value="a"
        onChange={onChange}
      />,
    );
    const tabA = screen.getByRole('tab', { name: 'Detalle' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Contenido A')).toBeInTheDocument();
    const panelB = screen.getByText('Contenido B').closest('[role="tabpanel"]');
    expect(panelB?.hasAttribute('hidden')).toBe(true);
  });

  it('cambia de pestaña al hacer clic', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { id: 'a', label: 'Detalle', content: <p>Contenido A</p> },
          { id: 'b', label: 'Opciones', content: <p>Contenido B</p> },
        ]}
        value="a"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Opciones' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('respeta pestañas deshabilitadas', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { id: 'a', label: 'Detalle', content: <p>Contenido A</p> },
          { id: 'b', label: 'Opciones', content: <p>Contenido B</p>, disabled: true },
        ]}
        value="a"
        onChange={onChange}
      />,
    );
    const tabB = screen.getByRole('tab', { name: 'Opciones' });
    expect(tabB).toBeDisabled();
    fireEvent.click(tabB);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('asocia tabpanel con aria-labelledby', () => {
    render(
      <Tabs
        items={[
          { id: 'a', label: 'Detalle', content: <p>Contenido A</p> },
        ]}
        value="a"
        onChange={vi.fn()}
      />,
    );
    const tab = screen.getByRole('tab', { name: 'Detalle' });
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });
});
