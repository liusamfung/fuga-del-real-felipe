// La lógica de un poder especial del jugador (la granada): se puede usar cuando está lista, para
// usarlo hay que superar un reto de inglés, y después tiene que recargar. Es lógica pura, sin Phaser:
// todos los tiempos entran como el parámetro `ahora` (en milisegundos), así se prueba con `npm test`.
//
// Estados:
//   'lista'       se puede usar
//   'en-reto'     el jugador está respondiendo el reto; todavía no corre la recarga
//   'recargando'  ya se usó; falta tiempo para volver a usarlo
//
// La recarga empieza cuando TERMINA el reto, no cuando empieza: el tiempo que se tarda en responder
// no se descuenta. Si el jugador falla, la recarga es más corta que si acierta: un fallo ya cuesta el
// reto y no hay granada, pero no debe dejarlo sin poder mucho rato.
export class PoderConRecarga {
	/**
	 * @param recargaTrasAcierto ms de recarga después de acertar el reto (y lanzar el poder)
	 * @param recargaTrasFallo ms de recarga después de fallar el reto o quedarse sin tiempo
	 */
	constructor({ recargaTrasAcierto, recargaTrasFallo }) {
		this.recargaTrasAcierto = recargaTrasAcierto;
		this.recargaTrasFallo = recargaTrasFallo;
		this.estado = 'lista';
		this.inicioDeLaRecarga = 0;
		this.recargaActual = 0; // cuánto dura la recarga que está corriendo
	}

	/** Intenta usar el poder. Devuelve verdadero si estaba lista y pasa a esperar el reto. */
	intentarUsar(ahora) {
		this.#recargarSiCorresponde(ahora);
		if (this.estado !== 'lista') {
			return false;
		}

		this.estado = 'en-reto';
		return true;
	}

	/** El reto terminó: `acerto` es verdadero si se superó. Empieza la recarga. No hace nada si no había reto. */
	terminar(acerto, ahora) {
		if (this.estado !== 'en-reto') {
			return;
		}

		this.estado = 'recargando';
		this.inicioDeLaRecarga = ahora;
		this.recargaActual = acerto ? this.recargaTrasAcierto : this.recargaTrasFallo;
	}

	/** Verdadero si se puede usar ahora mismo. */
	estaLista(ahora) {
		this.#recargarSiCorresponde(ahora);
		return this.estado === 'lista';
	}

	/**
	 * Cuánto de la recarga ha pasado, de 0 a 1: es 1 cuando está lista y 0 mientras se responde el reto.
	 * Nunca sale de ese rango, ni siquiera si el reloj retrocede: el HUD lo usa para dibujar una barra.
	 */
	progresoDeLaRecarga(ahora) {
		this.#recargarSiCorresponde(ahora);
		if (this.estado === 'lista') {
			return 1;
		}
		if (this.estado === 'en-reto') {
			return 0;
		}

		const progreso = (ahora - this.inicioDeLaRecarga) / this.recargaActual;
		return Math.min(1, Math.max(0, progreso));
	}

	#recargarSiCorresponde(ahora) {
		if (this.estado === 'recargando' && ahora >= this.inicioDeLaRecarga + this.recargaActual) {
			this.estado = 'lista';
		}
	}
}
