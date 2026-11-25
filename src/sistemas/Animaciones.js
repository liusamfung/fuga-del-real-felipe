import { ANIMACIONES } from '../datos/animaciones.js';

/** Crea todas las animaciones de src/datos/animaciones.js. Llamar una sola vez, al arrancar. */
export function crearAnimaciones(escena) {
	for (const { clave, textura, cuadros, fps, repetir } of ANIMACIONES) {
		escena.anims.create({
			key: clave,
			frames: escena.anims.generateFrameNumbers(textura, { frames: cuadros }),
			frameRate: fps,
			repeat: repetir ? -1 : 0,
		});
	}
}
