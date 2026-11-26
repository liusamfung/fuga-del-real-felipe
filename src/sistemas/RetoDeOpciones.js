import { elegirOpcion } from '../utilidades/opciones.js';

// Un reto de opciones (niveles 1 y 2 de los retos de inglés): hay que decir cuál de las opciones es
// la correcta antes de que se acabe el tiempo. Es lógica pura, sin Phaser ni micrófono: los tiempos
// entran como el parámetro `ahora` (en milisegundos) y lo que dijo el jugador como textos. Así sirve
// igual para la voz y para el teclado (plan B), y se prueba con `npm test`.
//
// Estados:
//   'esperando'      todavía no empezó (la pantalla espera a que el micrófono esté escuchando)
//   'activo'         se puede responder; el tiempo corre
//   'acertada'       se eligió la opción correcta a tiempo
//   'fallada'        se eligió otra opción: la primera elección es la que vale
//   'tiempo-agotado' se acabó el tiempo sin elegir
export class RetoDeOpciones {
	/**
	 * @param opciones las palabras entre las que se elige (en inglés)
	 * @param correcta la posición (desde 0) de la correcta en `opciones`
	 * @param tiempoTotal ms para responder, contados desde `empezar`
	 * @param letrasPorError cuántas letras de cada opción permiten una edición al comparar con lo oído
	 */
	constructor({ opciones, correcta, tiempoTotal, letrasPorError = 3 }) {
		if (!Array.isArray(opciones) || opciones.length < 2) {
			throw new Error('Un reto de opciones necesita al menos dos opciones');
		}
		if (!Number.isInteger(correcta) || correcta < 0 || correcta >= opciones.length) {
			throw new Error(`La opción correcta (${correcta}) no está entre las opciones`);
		}

		this.opciones = opciones;
		this.correcta = correcta;
		this.tiempoTotal = tiempoTotal;
		this.letrasPorError = letrasPorError;
		this.estado = 'esperando';
		this.elegida = null; // la posición de la opción elegida
		this.inicio = 0;
	}

	/** Empieza a correr el tiempo. Solo la primera vez: llamarlo otra vez no reinicia la cuenta. */
	empezar(ahora) {
		if (this.estado === 'esperando') {
			this.estado = 'activo';
			this.inicio = ahora;
		}
	}

	/** Verdadero cuando ya no se puede seguir: se acertó, se falló o se acabó el tiempo. */
	get terminada() {
		return this.estado !== 'esperando' && this.estado !== 'activo';
	}

	tiempoRestante(ahora) {
		if (this.estado === 'esperando') {
			return this.tiempoTotal;
		}
		return Math.min(this.tiempoTotal, Math.max(0, this.tiempoTotal - (ahora - this.inicio)));
	}

	/** Cuánto tiempo queda, de 1 (todo) a 0 (nada). */
	fraccionRestante(ahora) {
		return this.tiempoRestante(ahora) / this.tiempoTotal;
	}

	/** Revisa si se acabó el tiempo. Devuelve el estado. */
	actualizar(ahora) {
		if (this.estado === 'activo' && ahora - this.inicio >= this.tiempoTotal) {
			this.estado = 'tiempo-agotado';
		}
		return this.estado;
	}

	/**
	 * El jugador eligió una opción (por la posición). Devuelve 'acierto', 'error' o 'ignorada' (si el
	 * reto no está activo o la posición no existe). La primera elección es la que vale.
	 */
	elegir(indice, ahora) {
		this.actualizar(ahora);
		if (this.estado !== 'activo' || !Number.isInteger(indice)) {
			return 'ignorada';
		}
		if (indice < 0 || indice >= this.opciones.length) {
			return 'ignorada';
		}

		this.elegida = indice;
		if (indice === this.correcta) {
			this.estado = 'acertada';
			return 'acierto';
		}
		this.estado = 'fallada';
		return 'error';
	}

	/**
	 * El navegador oyó esto (todas las alternativas de todos los resultados hasta ahora). Si encaja con
	 * UNA sola opción, esa es la elegida. Si no encaja con ninguna, o con dos por igual (el jugador
	 * dijo dos opciones), no pasa nada y se sigue escuchando. Devuelve lo mismo que `elegir`.
	 */
	oir(textos, ahora) {
		this.actualizar(ahora);
		if (this.estado !== 'activo') {
			return 'ignorada';
		}

		const decision = elegirOpcion(textos, this.opciones, { letrasPorError: this.letrasPorError });
		return decision.indice < 0 ? 'ignorada' : this.elegir(decision.indice, ahora);
	}
}
