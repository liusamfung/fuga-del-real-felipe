// La rampa de la cámara lenta: la velocidad del mundo (1 = normal, 0,2 = cinco veces más lento) no salta de
// golpe, sino que baja y sube de forma suave. Es lógica pura, sin Phaser: el tiempo entra como el parámetro
// `ahora` (en milisegundos) y devuelve la escala; quien la use se la aplica a la física, las animaciones y
// los temporizadores. Se prueba con `npm test`.
//
//   const rampa = new RampaDeTiempo({ factor: 0.2, entrada: 120, salida: 200 });
//   rampa.fijar(true, ahora);     // quiere cámara lenta (se puede llamar en cada fotograma: no hace nada si ya estaba)
//   rampa.escala(ahora);          // 1 normal … 0,2 en plena cámara lenta, y todo lo que hay en medio
//
// Si se cambia de idea a mitad de una rampa, sigue desde donde iba (no vuelve al extremo): una rampa a medias
// tarda proporcionalmente menos.
export class RampaDeTiempo {
	/**
	 * @param factor la escala en plena cámara lenta (0,2: el mundo va a una quinta parte)
	 * @param entrada ms que tarda en pasar de la velocidad normal a `factor`
	 * @param salida ms que tarda en volver de `factor` a la velocidad normal
	 */
	constructor({ factor, entrada, salida }) {
		this.factor = factor;
		this.entrada = entrada;
		this.salida = salida;
		this.lenta = false; // lo que se pide: verdadero = cámara lenta
		this.desde = 1;
		this.hacia = 1;
		this.inicio = 0;
		this.duracion = 0;
	}

	/** Pide cámara lenta (`true`) o velocidad normal (`false`). Repetir lo mismo no reinicia la rampa. */
	fijar(lenta, ahora) {
		if (lenta === this.lenta) {
			return;
		}

		this.desde = this.escala(ahora);
		this.hacia = lenta ? this.factor : 1;
		this.inicio = ahora;
		// Una rampa a medias dura proporcionalmente: del extremo al otro es el recorrido completo (1 - factor).
		const recorrido = Math.abs(this.hacia - this.desde) / (1 - this.factor);
		this.duracion = (lenta ? this.entrada : this.salida) * recorrido;
		this.lenta = lenta;
	}

	/** La escala de tiempo en este instante: de `factor` (cámara lenta) a 1 (normal). */
	escala(ahora) {
		if (this.duracion <= 0) {
			return this.hacia;
		}

		const avance = Math.min(1, Math.max(0, (ahora - this.inicio) / this.duracion));
		return this.desde + (this.hacia - this.desde) * avance;
	}

	/**
	 * Vuelve a la velocidad normal de golpe, sin rampa de salida. Se usa cuando lo que viene necesita el mundo a toda
	 * velocidad desde ya (por ejemplo, el dash automático del ataque fuerte: en plena salida de la cámara lenta la
	 * física avanza menos y el dash recorría la mitad).
	 */
	cortar() {
		this.lenta = false;
		this.desde = 1;
		this.hacia = 1;
		this.duracion = 0;
	}

	/** Verdadero mientras el mundo no va a velocidad normal (incluida la rampa de salida). */
	estaEnCamaraLenta(ahora) {
		return this.escala(ahora) < 1;
	}
}
