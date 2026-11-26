import { letrasDeLoDicho } from '../utilidades/voz.js';

// El reconocedor de voz del navegador no manda letras sueltas: manda una LISTA de resultados con lo
// que cree haber oído, y la va corrigiendo mientras la persona habla (resultados provisionales) hasta
// darla por final. Este acumulador entrega solo las letras NUEVAS, para que ninguna cuente dos veces.
//
// Chrome reparte lo que oye entre varios resultados a la vez y luego los junta. Ejemplo real, al
// decir "ere o de i ele":
//   [«r o d»]                ← resultado 0
//   [«r o d», «i l»]         ← el 1 aparece al lado...
//   [«r o d i», «l»]         ← ...y el 0 se come parte del 1
//   [«r o d i l»]            ← final: todo en el 0
// Por eso NO se cuenta cada resultado por separado (daría letras repetidas y desordenadas): se unen
// todos en un solo texto, que solo crece, y se cuentan las letras de ese texto.
//
// `retenerUltima`: guarda la última letra mientras el último resultado sea provisional, por si
// Chrome la corrige. Cuesta ~1,3 s por palabra (hasta que llega el resultado final) y en la prueba de
// voz casi no evitó errores, así que hoy va apagado.
//
// Es lógica pura (sin micrófono): se prueba con `npm test`.
export class AcumuladorDeVoz {
	constructor({ retenerUltima = false } = {}) {
		this.retenerUltima = retenerUltima;
		this.entregadas = 0; // cuántas letras del texto unido ya se entregaron
	}

	/** Olvida todo: se usa cuando el reconocedor empieza una sesión nueva. */
	reiniciar() {
		this.entregadas = 0;
	}

	/**
	 * Recibe la lista COMPLETA de resultados (`[{ texto, esFinal }]`, en orden) y devuelve las letras
	 * NUEVAS (cada una, una lista de candidatas; ver `letrasDeLoDicho`).
	 */
	procesar(resultados) {
		if (resultados.length === 0) {
			return [];
		}

		const letras = resultados.flatMap(({ texto }) => letrasDeLoDicho(texto).letras);
		const ultimoEsFinal = resultados.at(-1).esFinal;
		const limite =
			ultimoEsFinal || !this.retenerUltima ? letras.length : Math.max(0, letras.length - 1);

		if (limite <= this.entregadas) {
			return [];
		}

		const nuevas = letras.slice(this.entregadas, limite);
		this.entregadas = limite;
		return nuevas;
	}
}
