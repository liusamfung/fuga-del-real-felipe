// Las reglas de cómo avanza (o termina) la partida. Es lógica pura, sin Phaser: se prueba con `npm test`.
//
//   - Si el jugador MUERE, vuelve a empezar desde el nivel 1 (siempre, esté en el nivel que esté).
//   - Si derrota al jefe de un nivel, pasa al siguiente.
//   - Si derrota al jefe del ÚLTIMO nivel, gana el juego. No hay más niveles después.
// Quien lo usa (`EscenaJuego`) muestra el cartel que toca (src/datos/carteles.js) y empieza el nivel que se indica.

/** El nivel con el que empieza una partida nueva y al que se vuelve al perder o al ganar. */
export const NIVEL_INICIAL = 1;

/**
 * Qué pasa cuando el jugador muere. Devuelve `{ tipo: 'derrota', siguiente }`: `siguiente` es el nivel con el que se
 * empieza de nuevo, siempre el primero.
 */
export function alMorir() {
	return { tipo: 'derrota', siguiente: NIVEL_INICIAL };
}

/**
 * Qué pasa cuando el jugador derrota al jefe del nivel `nivel` (de `totalDeNiveles` que tiene el juego). Devuelve:
 *   { tipo: 'nivel-completado', siguiente }   hay un nivel después: `siguiente` es su número
 *   { tipo: 'victoria', siguiente }           era el último: se ganó el juego, y `siguiente` es el nivel con el que se
 *                                             empezaría de nuevo si el jugador quiere volver a jugar
 */
export function alDerrotarAlJefe(nivel, totalDeNiveles) {
	if (nivel < totalDeNiveles) {
		return { tipo: 'nivel-completado', siguiente: nivel + 1 };
	}
	return { tipo: 'victoria', siguiente: NIVEL_INICIAL };
}
