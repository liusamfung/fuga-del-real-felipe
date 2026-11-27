// Los carteles que tapan la pantalla cuando termina algo (src/escenas/EscenaCartel.js). Cada uno tiene un título, un
// subtítulo, lo que dice el botón y su color. Los textos son los que pidió el usuario (27/11/2026).
//
//   derrota           «Perdiste» / «¿Deseas volver a intentarlo?»: el jugador murió. Hay que pulsar el botón para volver a
//                     empezar desde el nivel 1.
//   nivel-completado  se derrotó al jefe de un nivel y hay otro después.
//   victoria          «¡Ganaste!»: se derrotó al jefe del último nivel. Es el final del juego.

import { NIVEL_INICIAL } from '../sistemas/ProgresoDelJuego.js';

/**
 * El cartel que corresponde a un desenlace de `ProgresoDelJuego` (`{ tipo, siguiente }`). Los colores son los de la
 * interfaz: rojo para perder, verde para pasar de nivel y dorado para ganar.
 */
export function cartelDe({ tipo, siguiente }) {
	switch (tipo) {
		case 'derrota':
			return {
				titulo: 'Perdiste',
				subtitulo: '¿Deseas volver a intentarlo?',
				boton: `Volver a intentar (nivel ${NIVEL_INICIAL})`,
				color: 0xe0695b,
			};
		case 'nivel-completado':
			return {
				titulo: '¡Nivel completado!',
				subtitulo: `Derrotaste al jefe. Ahora, el nivel ${siguiente}.`,
				boton: 'Continuar',
				color: 0x7fd18a,
			};
		case 'victoria':
			return {
				titulo: '¡Ganaste!',
				subtitulo: 'Cada día estás más cerca de ser bilingüe',
				boton: 'Jugar de nuevo',
				color: 0xffd166,
			};
		default:
			throw new Error(`No hay cartel para «${tipo}»`);
	}
}
