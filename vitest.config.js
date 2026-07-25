import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // Toda la lógica de src/ es pura y sin DOM: no hace falta jsdom.
    // Si algún test necesitara el navegador, esa lógica está mal ubicada.
    environment: 'node',
  },
});
