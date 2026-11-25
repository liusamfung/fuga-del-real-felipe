import { letrasDeLoDicho } from '../utilidades/voz.js';

// El reconocedor de voz del navegador no manda letras sueltas: manda el texto completo de cada
// "resultado" y lo va corrigiendo mientras la persona habla (resultados provisionales) hasta que lo
// da por final. Este acumulador se acuerda de cuántas letras ya entregó de cada resultado y solo
// entrega las nuevas, para que ninguna cuente dos veces.
//
// `retenerUltima`: en un resultado provisional, la última letra es la que más se corrige, así que se
// guarda hasta que llegue otra detrás o el resultado sea final. Pierde un instante pero evita dar por
// buena una letra que el navegador cambia después.
//
// Es lógica pura (sin micrófono): se prueba con `npm test`.
export class AcumuladorDeVoz {
	constructor({ retenerUltima = true } = {}) {
		this.retenerUltima = retenerUltima;
		this.entregadas = new Map(); // número de resultado → cuántas letras ya se entregaron
	}

	/** Olvida todo: se usa cuando el reconocedor empieza una sesión nueva (los números se reinician). */
	reiniciar() {
		this.entregadas.clear();
	}

	/**
	 * Recibe el texto de un resultado y devuelve las letras NUEVAS (cada una, una lista de
	 * candidatas; ver `letrasDeLoDicho`).
	 */
	procesar(numeroDeResultado, texto, esFinal) {
		const { letras } = letrasDeLoDicho(texto);
		const limite = esFinal || !this.retenerUltima ? letras.length : Math.max(0, letras.length - 1);
		const yaEntregadas = this.entregadas.get(numeroDeResultado) ?? 0;

		if (limite <= yaEntregadas) {
			return [];
		}

		this.entregadas.set(numeroDeResultado, limite);
		return letras.slice(yaEntregadas, limite);
	}
}
