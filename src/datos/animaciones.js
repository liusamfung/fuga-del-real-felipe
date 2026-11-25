// Animaciones de los personajes. Cada animación dice qué cuadros de una hoja de sprites se
// reproducen y a qué velocidad. Se crean una sola vez al arrancar (src/sistemas/Animaciones.js).

// Orden de las filas de la hoja del jugador. Cada fila tiene 3 cuadros: quieto, paso 1 y paso 2.
export const DIRECCIONES_DEL_JUGADOR = Object.freeze(['abajo', 'derecha', 'izquierda', 'arriba']);
export const CUADROS_POR_DIRECCION = 3;

/** Número del cuadro "quieto" del jugador mirando en esa dirección. */
export function cuadroQuietoDelJugador(direccion) {
	return DIRECCIONES_DEL_JUGADOR.indexOf(direccion) * CUADROS_POR_DIRECCION;
}

export const ANIMACIONES = Object.freeze([
	// Caminar: quieto, paso 1, quieto, paso 2 (así los pies se alternan sin saltos).
	...DIRECCIONES_DEL_JUGADOR.map((direccion) => {
		const quieto = cuadroQuietoDelJugador(direccion);
		return {
			clave: `jugador-caminar-${direccion}`,
			textura: 'jugador',
			cuadros: [quieto, quieto + 1, quieto, quieto + 2],
			fps: 8,
			repetir: true,
		};
	}),

	{
		clave: 'enemigo-debil-caminar',
		textura: 'enemigo-debil',
		cuadros: [0, 1],
		fps: 4,
		repetir: true,
	},
]);
