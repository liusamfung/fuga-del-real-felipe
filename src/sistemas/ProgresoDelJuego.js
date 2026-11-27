// Las reglas de cómo avanza (o termina) la partida. Es lógica pura, sin Phaser: se prueba con `npm test`.
//
//   - Si el jugador MUERE, vuelve a empezar desde el nivel 1 (siempre, esté en el nivel que esté).
//   - Si derrota al jefe de un nivel, pasa al siguiente y CONSERVA sus estadísticas (la vida que le queda, los corazones
//     extra, el ataque y la velocidad): no se cura ni se reinicia. Empezar de nuevo (tras morir o ganar) sí las reinicia.
//   - Si derrota al jefe del ÚLTIMO nivel, gana el juego. No hay más niveles después.
// Quien lo usa (`EscenaJuego`) muestra el cartel que toca (src/datos/carteles.js) y empieza el nivel que se indica.

/** El nivel con el que empieza una partida nueva y al que se vuelve al perder o al ganar. */
export const NIVEL_INICIAL = 1;

/**
 * Qué pasa cuando el jugador muere. Devuelve `{ tipo: 'derrota', siguiente, conservaEstadisticas }`: `siguiente` es
 * el nivel con el que se empieza de nuevo, siempre el primero, y con las estadísticas del principio.
 */
export function alMorir() {
	return { tipo: 'derrota', siguiente: NIVEL_INICIAL, conservaEstadisticas: false };
}

/**
 * Qué pasa cuando el jugador derrota al jefe del nivel `nivel` (de `totalDeNiveles` que tiene el juego). Devuelve:
 *   { tipo: 'nivel-completado', siguiente, conservaEstadisticas: true }
 *       hay un nivel después: `siguiente` es su número y el jugador llega a él con sus estadísticas
 *   { tipo: 'victoria', siguiente, conservaEstadisticas: false }
 *       era el último: se ganó el juego, y `siguiente` es el nivel con el que se empezaría de nuevo (de cero) si el
 *       jugador quiere volver a jugar
 */
export function alDerrotarAlJefe(nivel, totalDeNiveles) {
	if (nivel < totalDeNiveles) {
		return { tipo: 'nivel-completado', siguiente: nivel + 1, conservaEstadisticas: true };
	}
	return { tipo: 'victoria', siguiente: NIVEL_INICIAL, conservaEstadisticas: false };
}
