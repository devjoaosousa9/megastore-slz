import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORE } from '@/config/store';
import { DEFAULT_CHOICE, useExperience } from '@/store/useExperience';
import { FinishPicker, ModelPicker, Notice, StoragePicker } from '@/components/ui/Options';
import { InterestList } from '@/components/ui/InterestList';
import { Escolha } from '@/components/sections/Escolha';
import { Conferido } from '@/components/sections/Conferido';
import { Loja, SiteFooter } from '@/components/sections/Loja';
import { LoadState, Stage } from '@/components/Stage';
import { useMotionPreference } from '@/hooks/useMotionPreference';

vi.mock('next/dynamic', () => ({ default: () => () => null }));

beforeEach(() => {
  useExperience.setState({
    choice: { ...DEFAULT_CHOICE },
    list: [],
    listOpen: false,
    notice: null,
    renderStatus: 'pending',
    systemReducedMotion: false,
    motionPaused: false,
    phoneChanges: 0,
  });
});

const decodedHref = (el: HTMLElement) => decodeURIComponent(el.getAttribute('href') ?? '');

describe('model picker', () => {
  it('offers every model and marks the selected one', async () => {
    render(<ModelPicker />);
    expect(screen.getAllByRole('radio')).toHaveLength(7);
    await userEvent.click(screen.getByRole('radio', { name: /15 Pro Max/ }));
    expect(useExperience.getState().choice.phoneId).toBe('iphone-15-pro-max');
    expect(screen.getByRole('radio', { name: /15 Pro Max/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('supports arrow-key navigation (radiogroup pattern)', async () => {
    render(<ModelPicker />);
    screen.getByRole('radio', { name: /^15 Pro 2023$/ }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(useExperience.getState().choice.phoneId).toBe('iphone-15');
    expect(screen.getByRole('radio', { name: /^15 2023$/ })).toHaveFocus();
  });
});

describe('finish and storage', () => {
  it('shows the colour name in the group label and changes it', async () => {
    render(<FinishPicker />);
    expect(screen.getByRole('radiogroup', { name: 'Cor: Titânio natural' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Titânio azul' }));
    expect(screen.getByRole('radiogroup', { name: 'Cor: Titânio azul' })).toBeInTheDocument();
  });

  it('lists only the storage the selected model was sold with', () => {
    render(<StoragePicker />);
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['128 GB', '256 GB', '512 GB', '1 TB']);
    act(() => useExperience.getState().setPhone('iphone-15-pro-max'));
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['256 GB', '512 GB', '1 TB']);
  });

  it('announces when a choice had to be adjusted', () => {
    render(<Notice />);
    act(() => useExperience.getState().setPhone('iphone-13'));
    expect(screen.getByRole('status')).toHaveTextContent(/Ajustamos sua escolha/);
  });
});

describe('configurator', () => {
  it('asks the store about the exact configuration on WhatsApp', async () => {
    render(<Escolha />);
    await userEvent.click(screen.getByRole('radio', { name: /^14 Pro/ }));
    await userEvent.click(screen.getByRole('radio', { name: '512 GB' }));
    const link = screen.getByRole('link', { name: /Perguntar por este/ });
    expect(link.getAttribute('href')).toMatch(new RegExp(`^https://wa\\.me/${STORE.whatsapp}\\?text=`));
    expect(decodedHref(link)).toContain('iPhone 14 Pro (512 GB, Preto-espacial)');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('never shows a price', () => {
    const { container } = render(<Escolha />);
    expect(container.textContent).not.toMatch(/R\$/);
    expect(container.textContent).toContain('confirmados pela loja no WhatsApp');
  });

  it('turns the phone with the keyboard and the toolbar', async () => {
    render(<Escolha />);
    const viewer = screen.getByRole('group', { name: /Visualizador do iPhone/ });
    viewer.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(useExperience.getState().turntable.yaw).toBeCloseTo(Math.PI / 8);
    await userEvent.click(screen.getByRole('button', { name: 'Voltar à posição' }));
    expect(useExperience.getState().turntable.yaw).toBe(0);
  });

  it('adds the configuration to the list', async () => {
    render(
      <>
        <Escolha />
        <InterestList />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à lista' }));
    expect(useExperience.getState().list).toEqual([
      { key: 'iphone-15-pro:natural-titanium:256 GB', label: 'iPhone 15 Pro', detail: '256 GB, Titânio natural' },
    ]);
    const dialog = screen.getByRole('dialog', { name: /Minha lista/ });
    const send = within(dialog).getByRole('link', { name: /Enviar lista no WhatsApp/ });
    expect(decodedHref(send)).toContain('• iPhone 15 Pro (256 GB, Titânio natural)');
  });
});

describe('interest list', () => {
  it('explains the empty state and has no send button', () => {
    act(() => useExperience.setState({ listOpen: true }));
    render(<InterestList />);
    expect(screen.getByText(/Sua lista está vazia/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Enviar lista/ })).toBeNull();
  });

  it('removes items', async () => {
    act(() =>
      useExperience.setState({
        listOpen: true,
        list: [{ key: 'a', label: 'iPhone 13', detail: '128 GB, Azul' }],
      }),
    );
    render(<InterestList />);
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(useExperience.getState().list).toHaveLength(0);
  });
});

describe('content', () => {
  it('follows the selected model in the tour', () => {
    act(() => useExperience.getState().setPhone('iphone-15-pro-max'));
    render(<Conferido />);
    expect(screen.getByText(/159,9 mm de altura/)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('shows the real store address, hours and contact', () => {
    render(<Loja />);
    expect(screen.getByText(/Torre Empresarial 2, sala 313/)).toBeInTheDocument();
    expect(screen.getByText('10h às 20h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(STORE.phone.replace(/[()]/g, '\\$&')) })).toHaveAttribute(
      'href',
      expect.stringContaining(`wa.me/${STORE.whatsapp}`),
    );
  });

  it('credits Apple’s trademarks in the footer', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/marcas registradas da Apple Inc/)).toBeInTheDocument();
  });
});

describe('3D stage', () => {
  it('falls back to still renders when WebGL is unavailable', async () => {
    render(
      <>
        <Stage />
        <Escolha />
      </>,
    );
    expect(await screen.findByText(/Seu aparelho não exibe o 3D/)).toBeInTheDocument();
    const img = screen.getByRole('img', { name: /iPhone 15 Pro, vista traseira/ });
    expect(img.getAttribute('src')).toMatch(/\/renders\/iphone-15-pro\.webp$/);
  });

  it('describes the model for screen readers', () => {
    render(<Stage />);
    expect(screen.getByText('Modelo 3D do iPhone 15 Pro, 256 GB, na cor Titânio natural.')).toBeInTheDocument();
  });

  it('shows a loading state until the first frame', () => {
    const { rerender } = render(<LoadState />);
    expect(screen.getByRole('status')).toHaveTextContent('Preparando o 3D');
    act(() => useExperience.getState().setRenderStatus('ready'));
    rerender(<LoadState />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('reduced motion', () => {
  function Probe() {
    const reduced = useMotionPreference();
    return <span>{reduced ? 'reduced' : 'full'}</span>;
  }

  it('follows prefers-reduced-motion', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    render(<Probe />);
    expect(screen.getByText('reduced')).toBeInTheDocument();
    expect(document.documentElement.dataset.motion).toBe('reduced');
    window.matchMedia = original;
  });

  it('can be paused by the user', () => {
    render(<Probe />);
    expect(screen.getByText('full')).toBeInTheDocument();
    act(() => useExperience.getState().toggleMotion());
    expect(screen.getByText('reduced')).toBeInTheDocument();
  });
});
