// Un diagnóstico de por qué el micrófono «escucha» pero no llega ningún texto. Es una función pura, sin Phaser ni
// micrófono: se prueba con `npm test`.
//
// Chrome avisa de lo que va pasando con eventos de bajo nivel (ver `ReconocedorDeVoz`, opción `alEvento`):
//   audio     abrió el micrófono
//   sonido    detectó SONIDO (cualquiera: voz, ruido…). Si nunca llega, Chrome está recibiendo silencio: el micrófono
//             que usa no es el que suena (otro dispositivo elegido, silenciado, nivel de entrada en cero)
//   voz       detectó VOZ
//   resultado el servicio devolvió texto (aunque sea provisional)
//   abortos   cuántas veces se cortó el reconocimiento sin que lo pidiéramos (`aborted`): pasa si otra pestaña usa
//             el reconocimiento al mismo tiempo
// Esos datos dicen en qué punto de la cadena se rompe. OJO: el último caso («oyó voz pero no entregó texto») NO dice por
// qué: puede ser que Chrome no entendió lo dicho, que el servicio tardó o falló, o que el texto llegó de una sesión que
// ya se había cerrado (ver `tardios` en `resumenDeLaVoz`). Por eso el cartel también muestra los contadores.

/** Cuánto esperar (ms) escuchando sin ningún resultado antes de decir que algo falla. */
export const ESPERA_DEL_DIAGNOSTICO = 3500;

/**
 * El mensaje que explica por qué no llega texto, o '' si todavía no toca avisar o todo va bien (ya llegó texto).
 *
 * @param estado `{ audio, sonido, voz, resultados, abortos }` lo que ha pasado desde que empezó a escuchar
 * @param msEscuchando cuánto tiempo lleva escuchando, en ms
 */
export function diagnosticoDeLaVoz(estado, msEscuchando, espera = ESPERA_DEL_DIAGNOSTICO) {
	if (msEscuchando < espera || estado.resultados > 0) {
		return '';
	}

	if (estado.abortos >= 2) {
		return 'El reconocimiento se corta solo: ¿hay otra pestaña del juego abierta?';
	}
	if (!estado.audio) {
		return 'Chrome no abre el micrófono: ¿lo usa otra pestaña o aplicación?';
	}
	if (!estado.sonido) {
		return 'A Chrome no le llega sonido: revisa el micrófono que usa y el volumen de entrada.';
	}
	if (!estado.voz) {
		return 'Chrome oye ruido pero no voz: habla más cerca y más fuerte.';
	}
	return 'Chrome oyó voz pero no entregó texto: dila más fuerte y más claro.';
}

/**
 * Los contadores del diagnóstico en una línea corta, para leerlos de un vistazo (o en una captura de pantalla):
 *   sesiones   cuántas veces arrancó Chrome el reconocimiento (muchas = se está cortando y reiniciando)
 *   silencios  cuántas veces Chrome dijo «no oí nada» (`no-speech`)
 *   tardíos    resultados que llegaron de una sesión que ya se había reemplazado y se descartaron
 *   modo       'continuo' (una sesión larga) o 'corto' (una por frase, con ?vozcorta)
 */
export function resumenDeLaVoz({ inicios, noSpeech, tardios }, continuo) {
	return `sesiones ${inicios} · silencios ${noSpeech} · tardíos ${tardios} · modo ${continuo ? 'continuo' : 'corto'}`;
}
