import { defineConfig } from 'vite';

export default defineConfig({
	// Rutas relativas: el juego compilado funciona aunque se publique dentro de una subcarpeta
	// (por ejemplo en GitHub Pages: usuario.github.io/nombre-del-repo/).
	base: './',
	build: {
		// Phaser pesa más de 500 kB; es normal, así que subimos el límite del aviso.
		chunkSizeWarningLimit: 2000,
	},
});
