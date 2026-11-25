import { letrasEsperadas, normalizarLetra } from '../utilidades/deletreo.js';

// Una palabra que se está deletreando: qué letra toca, cuántos errores van y cuánto tiempo queda.
// Es lógica pura, sin Phaser: los tiempos entran como el parámetro `ahora` (en milisegundos) y las
// letras como texto. Así sirve igual para el teclado y para la voz, y se prueba con `npm test`.
//
// Estados:
//   'esperando'      todavía no empezó
//   'mostrando'      se enseña la palabra para leerla; el tiempo todavía no corre y las letras no cuentan
//   'activo'         se está deletreando
//   'acertada'       se escribieron todas las letras a tiempo
//   'fallada'        se cometieron más errores de los permitidos
//   'tiempo-agotado' se acabó el tiempo
export class Deletreo {
	/**
	 * @param palabra la palabra tal como se muestra (puede llevar tildes)
	 * @param invertida si es verdadero, hay que deletrearla de la última letra a la primera
	 * @param tiempoTotal ms para completarla, contados desde que acaba la lectura
	 * @param lectura ms que se enseña la palabra antes de empezar a contar (0 = no hay lectura)
	 * @param erroresPermitidos letras equivocadas que se perdonan; una más y se falla
	 */
	constructor({ palabra, invertida = false, tiempoTotal, lectura = 0, erroresPermitidos = 0 }) {
		this.palabra = palabra;
		this.invertida = invertida;
		this.letras = letrasEsperadas(palabra, invertida);
		if (this.letras.length === 0) {
			throw new Error(`La palabra "${palabra}" no tiene letras`);
		}

		this.tiempoTotal = tiempoTotal;
		this.lectura = lectura;
		this.erroresPermitidos = erroresPermitidos;
		this.indice = 0; // cuántas letras van bien
		this.errores = 0;
		this.estado = 'esperando';
		this.inicio = 0; // cuándo empieza a correr el tiempo (después de la lectura)
	}

	empezar(ahora) {
		this.estado = this.lectura > 0 ? 'mostrando' : 'activo';
		this.inicio = ahora + this.lectura;
	}

	/** Verdadero cuando ya no se puede seguir: se acertó, se falló o se acabó el tiempo. */
	get terminada() {
		return this.estado !== 'esperando' && this.estado !== 'mostrando' && this.estado !== 'activo';
	}

	/** La letra que hay que escribir ahora (ya normalizada), o undefined si ya se completó. */
	get letraEsperada() {
		return this.letras[this.indice];
	}

	tiempoRestante(ahora) {
		// Durante la lectura todavía no corre: queda todo el tiempo.
		return Math.min(this.tiempoTotal, Math.max(0, this.tiempoTotal - (ahora - this.inicio)));
	}

	/** Cuánto tiempo queda, de 1 (todo) a 0 (nada). */
	fraccionRestante(ahora) {
		return this.tiempoRestante(ahora) / this.tiempoTotal;
	}

	/** Revisa si acabó la lectura o se acabó el tiempo. Devuelve el estado. */
	actualizar(ahora) {
		if (this.estado === 'mostrando' && ahora >= this.inicio) {
			this.estado = 'activo';
		}
		if (this.estado === 'activo' && ahora - this.inicio >= this.tiempoTotal) {
			this.estado = 'tiempo-agotado';
		}
		return this.estado;
	}

	/**
	 * Recibe una letra (lo que escribió o dijo el jugador). También puede ser una LISTA de letras
	 * candidatas, para cuando la voz no distingue entre dos (la B y la V suenan igual): se acierta si
	 * la que toca está entre ellas. Devuelve:
	 *   'acierto'  era la letra que tocaba
	 *   'error'    era otra letra
	 *   'ignorada' no era una letra, se está leyendo la palabra o ya terminó
	 * Las tildes y las mayúsculas no importan, pero la Ñ sí (una N no cuenta como Ñ).
	 */
	escribir(caracter, ahora) {
		this.actualizar(ahora);
		if (this.estado !== 'activo') {
			return 'ignorada';
		}

		const candidatas = (Array.isArray(caracter) ? caracter : [caracter])
			.map(normalizarLetra)
			.filter((letra) => letra !== null);
		if (candidatas.length === 0) {
			return 'ignorada';
		}

		if (candidatas.includes(this.letraEsperada)) {
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
