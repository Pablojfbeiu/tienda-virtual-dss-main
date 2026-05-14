import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App.jsx';

global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

test('renders store title', () => {
  render(<App />);
  expect(screen.getByText('Pruebas automaticas')).toBeTruthy();
});
