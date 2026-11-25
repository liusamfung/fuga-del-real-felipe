import { letrasEsperadas, normalizarLetra } from '../utilidades/deletreo.js';

// Una palabra que se está deletreando: qué letra toca, cuántos errores van y cuánto tiempo queda.
// Es lógica pura, sin Phaser: los tiempos entran como el parámetro `ahora` (en milisegundos) y las
// letras como texto. Así sirve igual para el teclado y para la voz, y se prueba con `npm test`.
//
// Estados:
//   'esperando'      todavía no empezó
//   'activo'         se está deletreando
//   'acertada'       se escribieron todas las letras a tiempo
//   'fallada'        se cometieron más errores de los permitidos
//   'tiempo-agotado' se acabó el tiempo
export class Deletreo {
	/**
	 * @param palabra la palabra tal como se muestra (puede llevar tildes)
	 * @param invertida si es verdadero, hay que deletrearla de la última letra a la primera
	 * @param tiempoTotal ms para completarla
	 * @param erroresPermitidos letras equivocadas que se perdonan; una más y se falla
	 */
	constructor({ palabra, invertida = false, tiempoTotal, erroresPermitidos = 0 }) {
		this.palabra = palabra;
		this.invertida = invertida;
		this.letras = letrasEsperadas(palabra, invertida);
		if (this.letras.length === 0) {
			throw new Error(`La palabra "${palabra}" no tiene letras`);
		}

		this.tiempoTotal = tiempoTotal;
		this.erroresPermitidos = erroresPermitidos;
		this.indice = 0; // cuántas letras van bien
		this.errores = 0;
		this.estado = 'esperando';
		this.inicio = 0;
	}

	empezar(ahora) {
		this.estado = 'activo';
		this.inicio = ahora;
	}

	/** Verdadero cuando ya no se puede seguir: se acertó, se falló o se acabó el tiempo. */
	get terminada() {
		return this.estado !== 'esperando' && this.estado !== 'activo';
	}

	/** La letra que hay que escribir ahora (ya normalizada), o undefined si ya se completó. */
	get letraEsperada() {
		return this.letras[this.indice];
	}

	tiempoRestante(ahora) {
		return Math.max(0, this.tiempoTotal - (ahora - this.inicio));
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
	 * Recibe una letra (lo que escribió o dijo el jugador). Devuelve:
	 *   'acierto'  era la letra que tocaba
	 *   'error'    era otra letra
	 *   'ignorada' no era una letra, o la palabra ya terminó
	 * Las tildes y las mayúsculas no importan, pero la Ñ sí (una N no cuenta como Ñ).
	 */
	escribir(caracter, ahora) {
		this.actualizar(ahora);
		if (this.estado !== 'activo') {
			return 'ignorada';
		}

		const letra = normalizarLetra(caracter);
		if (letra === null) {
			return 'ignorada';
		}

		if (letra === this.letraEsperada) {
			this.indice += 1;
			if (this.indice === this.letras.length) {
				this.estado = 'acertada';
			}
			return 'acierto';
		}

		this.errores += 1;
		if (this.errores > this.erroresPermitidos) {
			this.estado = 'fallada';
		}
		return 'error';
	}
}
