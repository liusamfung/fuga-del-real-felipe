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

	// Las ratas: 2 cuadros de caminar cada una. El ritmo acompaña a su velocidad (src/datos/enemigos.js).
	{ clave: 'rata-gris-caminar', textura: 'rata-gris', cuadros: [0, 1], fps: 5, repetir: true },
	{ clave: 'rata-blanca-caminar', textura: 'rata-blanca', cuadros: [0, 1], fps: 10, repetir: true },
	{ clave: 'rata-azul-caminar', textura: 'rata-azul', cuadros: [0, 1], fps: 3, repetir: true },
	{ clave: 'rata-negra-caminar', textura: 'rata-negra', cuadros: [0, 1], fps: 7, repetir: true },

	// Los guardias: 3 cuadros (de pie y dos pasos, uno a cada lado). Van de pie → paso → de pie → otro paso.
	{
		clave: 'guardia-azul-caminar',
		textura: 'guardia-azul',
		cuadros: [0, 1, 0, 2],
		fps: 6,
		repetir: true,
	},
	{
		clave: 'guardia-rojo-caminar',
		textura: 'guardia-rojo',
		cuadros: [0, 1, 0, 2],
		fps: 5,
		repetir: true,
	},

	// Los jefes flotan: van del cuadro 0 al 2 y vuelven por el 1, así el movimiento no da saltos. El del nivel 1 es
	// provisional (una copia del fantasma, ver src/datos/recursos.js): con su dibujo definitivo se ajustan los cuadros.
	{
		clave: 'jefe-1-flotar',
		textura: 'jefe-1',
		cuadros: [0, 1, 2, 1],
		fps: 4,
		repetir: true,
	},
	{
		clave: 'jefe-2-flotar',
		textura: 'jefe-2',
		cuadros: [0, 1, 2, 1],
		fps: 4,
		repetir: true,
	},
]);
