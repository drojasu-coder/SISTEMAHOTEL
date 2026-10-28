import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploader } from './ImageUploader';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { LANGUAGE_KEY } from '@/features/preferencias/storage';

describe('ImageUploader', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL / revokeObjectURL in JSDOM
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  it('renderiza dropzone cuando no hay imagen ni selección', () => {
    render(
      <ImageUploader
        label="Foto de prueba"
        currentImageUrl={null}
        selectedFile={null}
        removeMarked={false}
        onFileSelect={vi.fn()}
        onRemoveCurrent={vi.fn()}
      />,
    );
    expect(screen.getByText('Foto de prueba')).toBeInTheDocument();
    expect(screen.getByText('Subir archivo')).toBeInTheDocument();
  });

  it('renderiza imagen actual con opciones de cambiar y quitar', () => {
    const handleRemove = vi.fn();
    render(
      <ImageUploader
        label="Foto de prueba"
        currentImageUrl="https://example.com/foto.webp"
        selectedFile={null}
        removeMarked={false}
        onFileSelect={vi.fn()}
        onRemoveCurrent={handleRemove}
      />,
    );
    expect(screen.getByAltText('Fotografía actual')).toBeInTheDocument();
    expect(screen.getByText('Cambiar')).toBeInTheDocument();

    const deleteBtn = screen.getByLabelText('Quitar imagen');
    fireEvent.click(deleteBtn);
    expect(handleRemove).toHaveBeenCalled();
  });

  it('muestra estado de remoción pendiente cuando removeMarked es true', () => {
    render(
      <ImageUploader
        currentImageUrl="https://example.com/foto.webp"
        selectedFile={null}
        removeMarked={true}
        onFileSelect={vi.fn()}
        onRemoveCurrent={vi.fn()}
      />,
    );
    expect(screen.getByText(/La imagen actual será retirada/i)).toBeInTheDocument();
    expect(screen.getByText('Deshacer')).toBeInTheDocument();
  });

  it('muestra archivo nuevo seleccionado y botón de cancelación', () => {
    const file = new File(['test'], 'nueva-foto.webp', { type: 'image/webp' });
    const handleSelect = vi.fn();

    render(
      <ImageUploader
        currentImageUrl="https://example.com/antigua.webp"
        selectedFile={file}
        removeMarked={false}
        onFileSelect={handleSelect}
        onRemoveCurrent={vi.fn()}
      />,
    );

    expect(screen.getByText('nueva-foto.webp')).toBeInTheDocument();
    const cancelBtn = screen.getByLabelText('Cancelar selección');
    fireEvent.click(cancelBtn);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('ofrece un selector accesible y controles de imagen en inglés', () => {
    localStorage.setItem(LANGUAGE_KEY, 'en');
    render(<LocaleProvider><ImageUploader selectedFile={null} removeMarked={false} onFileSelect={vi.fn()} onRemoveCurrent={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('button', { name: /Upload file/ })).toBeEnabled();
    expect(screen.getByText('Photograph')).toBeInTheDocument();
    expect(screen.queryByText('Subir archivo')).not.toBeInTheDocument();
    localStorage.removeItem(LANGUAGE_KEY);
  });
});
