import { RECURSOS } from '../datos/recursos.js';

// Carga los recursos del catálogo (src/datos/recursos.js).
// Se usa en dos momentos de la escena de arranque:
//   - preload: carga los recursos que son archivos (hojas de sprites e imágenes).
//   - create: dibuja los recursos que son provisionales (generados por código).

/** Carga los recursos de tipo "hoja" e "imagen". Llamar desde `preload()`. */
export function cargarRecursos(escena) {
	for (const [clave, recurso] of Object.entries(RECURSOS)) {
		if (recurso.tipo === 'hoja') {
			escena.load.spritesheet(clave, recurso.ruta, {
				frameWidth: recurso.ancho,
				frameHeight: recurso.alto,
			});
		} else if (recurso.tipo === 'imagen') {
			escena.load.image(clave, recurso.ruta);
		}
	}
}

/** Dibuja los recursos de tipo "generado" como texturas. Llamar desde `create()`. */
export function generarRecursosProvisionales(escena) {
	for (const [clave, recurso] of Object.entries(RECURSOS)) {
		if (recurso.tipo !== 'generado') {
			continue;
		}

		const dibujo = escena.make.graphics({ x: 0, y: 0 }, false);
		for (const forma of recurso.formas) {
			dibujo.fillStyle(forma.color, 1);
			dibujo.fillRect(forma.x, forma.y, forma.ancho, forma.alto);
		}
		dibujo.generateTexture(clave, recurso.ancho, recurso.alto);
		dibujo.destroy();
	}
}
