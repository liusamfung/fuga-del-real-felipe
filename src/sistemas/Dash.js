// La lógica del dash (el impulso corto del jugador): cuántos usos quedan, cuánto falta para
// recargar y cuándo está en pleno impulso. Es lógica pura, sin Phaser: todos los tiempos entran
// como el parámetro `ahora` (en milisegundos), así se prueba con `npm test` sin ejecutar el juego.
//
// Recarga compartida: hay UN solo temporizador de recarga, que empieza con el primer uso.
//   - Con 1 carga: se usa el dash y hay que esperar la recarga completa.
//   - Con DobleDash (2 cargas): se pueden usar los dos dashes seguidos. El segundo no reinicia el
//     temporizador: cuando se cumple la recarga contada desde el primer uso, vuelven los dos.
export class Dash {
	/**
	 * @param duracion ms que dura el impulso
	 * @param recarga ms desde el primer uso hasta recuperar todas las cargas
	 * @param cargasMaximas cuántos dashes seguidos se pueden usar (1, o 2 con DobleDash)
	 */
	constructor({ duracion, recarga, cargasMaximas = 1 }) {
		this.duracion = duracion;
		this.recarga = recarga;
		this.cargasMaximas = cargasMaximas;

		this.usos = 0; // dashes usados desde que empezó la recarga actual
		this.inicioDeLaRecarga = 0;
		this.activoHasta = 0;
		this.direccion = { x: 0, y: 0 }; // hacia dónde va el impulso actual
	}

	/** Intenta usar el dash en esa dirección. Devuelve verdadero si empezó el impulso. */
	intentar(direccion, ahora) {
		this.#recargarSiCorresponde(ahora);
		if (this.estaActivo(ahora) || this.usos >= this.cargasMaximas) {
			return false;
		}

		if (this.usos === 0) {
			this.inicioDeLaRecarga = ahora; // el primer uso arranca el temporizador compartido
		}
		this.usos += 1;
		this.activoHasta = ahora + this.duracion;
		this.direccion = direccion;
		return true;
	}

	/** Verdadero mientras dura el impulso. */
	estaActivo(ahora) {
		return ahora < this.activoHasta;
	}

	/** Cuántos dashes se pueden usar ahora mismo. */
	cargasDisponibles(ahora) {
		this.#recargarSiCorresponde(ahora);
		return this.cargasMaximas - this.usos;
	}

	/**
	 * Cuánto de la recarga ha pasado, de 0 a 1. Es 1 cuando no hay nada que recargar. Nunca sale de
	 * ese rango, ni siquiera si el reloj retrocede: el HUD lo usa para dibujar una barra.
	 */
	progresoDeLaRecarga(ahora) {
		this.#recargarSiCorresponde(ahora);
		if (this.usos === 0) {
			return 1;
		}
		const progreso = (ahora - this.inicioDeLaRecarga) / this.recarga;
		return Math.min(1, Math.max(0, progreso));
	}

	/** DobleDash: el dash se puede usar 2 veces seguidas compartiendo la misma recarga. */
	activarDobleDash() {
		this.cargasMaximas = 2;
	}

	#recargarSiCorresponde(ahora) {
		if (this.usos > 0 && ahora >= this.inicioDeLaRecarga + this.recarga) {
			this.usos = 0;
		}
	}
}
