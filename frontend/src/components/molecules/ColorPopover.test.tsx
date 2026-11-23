import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ColorBadge } from '../atoms/ColorBadge';
import { ColorPopover } from './ColorPopover';

const COLORS = ['#2563eb', '#16a34a'];

describe('ColorPopover', () => {
  it('elige un color de la lista', () => {
    const onPick = vi.fn();
    render(<ColorPopover label="Color de la sede" value={null} colors={COLORS} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Color de la sede' }));
    fireEvent.click(screen.getByRole('button', { name: '#16a34a' }));

    expect(onPick).toHaveBeenCalledWith('#16a34a');
  });

  it('quita el color para volver al de la empresa', () => {
    const onPick = vi.fn();
    render(<ColorPopover label="Color de la sede" value="#2563eb" colors={COLORS} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Color de la sede' }));
    expect(screen.getByRole('button', { name: '#2563eb' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar color' }));

    expect(onPick).toHaveBeenCalledWith(null);
  });
});

describe('ColorBadge', () => {
  it('usa el color como tono y sin color queda neutral', () => {
    render(
      <>
        <ColorBadge color="#9333ea">THH HGO</ColorBadge>
        <ColorBadge color={null}>JOR PUEB</ColorBadge>
      </>,
    );

    expect(screen.getByText('THH HGO').style.getPropertyValue('--tone')).toBe('#9333ea');
    expect(screen.getByText('JOR PUEB').style.getPropertyValue('--tone')).toBe('');
    expect(screen.getByText('JOR PUEB').className).toContain('bg-neutral');
  });
});
