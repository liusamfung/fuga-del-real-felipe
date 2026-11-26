// Las reglas de la pelea con el jefe: su vida, cuándo lanza un ataque básico, cuándo viene un ataque fuerte y
// cómo termina. Es lógica pura, sin Phaser: los tiempos entran como el parámetro `ahora` (en milisegundos) y
// la pelea devuelve QUÉ hay que hacer (`actualizar`) sin hacerlo. Quien la use (la escena del juego) dibuja el
// ataque, abre el reto y aplica el daño. Así se prueba entera con `npm test`.
//
// Estados:
//   'esperando'      el jugador todavía no entró: el jefe no ataca y no recibe daño
//   'peleando'       el jefe lanza ataques básicos cada cierto tiempo y recibe daño
//   'ataque-fuerte'  el jugador está respondiendo el reto de inglés: el jefe no lanza más ataques básicos
//   'derrotado'      el jefe se quedó sin vida
//
// Un ataque fuerte viene cada vez que la vida del jefe baja de un umbral (por ejemplo 75 %, 50 % y 25 %). Si
// un golpe grande cruza dos umbrales de una vez, los ataques vienen UNO TRAS OTRO, no juntos.
// Docs: docs/mecanicas.md, sección 6.

/**
 * Cómo termina un ataque fuerte según lo que pasó en el reto:
 *   'devuelto'   se acertó rápido (todavía quedaba `rapido` o más del tiempo): el golpe se le devuelve al jefe
 *   'esquivado'  se acertó, pero tarde: el jugador se salva y nada más
 *   'golpe'      se falló o se acabó el tiempo: el golpe le cae al jugador (sí o sí)
 * `resultado` es el del reto ('acertada', 'fallada' o 'tiempo-agotado'); `fraccionRestante` es cuánto tiempo
 * quedaba al responder, de 1 (todo) a 0 (nada).
 */
export function desenlaceDelAtaqueFuerte(resultado, fraccionRestante, rapido = 0.5) {
	if (resultado !== 'acertada') {
		return 'golpe';
	}
	return fraccionRestante >= rapido ? 'devuelto' : 'esquivado';
}

/** El nivel del reto del ataque fuerte número `numero` (desde 0): la secuencia se repite si se acaba. */
export function nivelDelAtaqueFuerte(secuencia, numero) {
	return secuencia[numero % secuencia.length];
}

export class PeleaConElJefe {
	/**
	 * @param vidaMaxima la vida con que empieza el jefe
	 * @param umbrales fracciones de la vida (de mayor a menor) en las que viene un ataque fuerte, ej. [0.75, 0.5, 0.25]
	 * @param intervaloDeAtaque ms entre un ataque básico y el siguiente
	 * @param primerAtaque ms desde que empieza la pelea hasta el primer ataque básico
	 * @param nivelesDeInglesDeLosAtaquesFuertes el nivel del reto de cada ataque fuerte, en orden (ej. [1, 2, 1])
	 * @param devolucion fracción de la vida máxima que pierde el jefe si se le devuelve el golpe (ej. 0.1)
	 * @param rapido fracción del tiempo del reto que debe quedar para que acertar cuente como «rápido»
	 * @param pausaTrasElAtaqueFuerte ms de respiro tras un ataque fuerte, antes de otro ataque (básico o fuerte)
	 */
	constructor({
		vidaMaxima,
		umbrales,
		intervaloDeAtaque,
		primerAtaque,
		nivelesDeInglesDeLosAtaquesFuertes,
		devolucion,
		rapido = 0.5,
		pausaTrasElAtaqueFuerte,
	}) {
		this.vidaMaxima = vidaMaxima;
		this.umbrales = umbrales;
		this.intervaloDeAtaque = intervaloDeAtaque;
		this.primerAtaque = primerAtaque;
		this.niveles = nivelesDeInglesDeLosAtaquesFuertes;
		this.devolucion = devolucion;
		this.rapido = rapido;
		this.pausa = pausaTrasElAtaqueFuerte;

		this.vida = vidaMaxima;
		this.estado = 'esperando';
		this.ataquesFuertesIniciados = 0;
		this.proximoAtaque = 0; // cuándo toca el próximo ataque básico
		this.fuerteDesde = 0; // desde cuándo se puede empezar un ataque fuerte (hay un respiro tras cada uno)
	}

	/** La pelea empieza: el jefe ya ataca y recibe daño. Solo funciona la primera vez. */
	empezar(ahora) {
		if (this.estado !== 'esperando') {
			return;
		}

		this.estado = 'peleando';
		this.proximoAtaque = ahora + this.primerAtaque;
		this.fuerteDesde = ahora;
	}

	get derrotado() {
		return this.estado === 'derrotado';
	}

	/** Cuánta vida queda, de 1 (toda) a 0 (nada). */
	get fraccionDeVida() {
		return this.vida / this.vidaMaxima;
	}

	/** Verdadero si el jefe puede recibir daño ahora mismo. */
	get vulnerable() {
		return this.estado === 'peleando' || this.estado === 'ataque-fuerte';
	}

	/**
	 * El jefe recibe daño. Antes de que empiece la pelea y después de derrotado no pasa nada. Devuelve
	 * `{ aplicado, derrotado }`: cuánto daño se aplicó (nunca más que la vida que le quedaba) y si ese golpe lo
	 * derrotó.
	 */
	recibirDano(cantidad) {
		if (!this.vulnerable || cantidad <= 0) {
			return { aplicado: 0, derrotado: false };
		}

		const aplicado = Math.min(cantidad, this.vida);
		this.vida -= aplicado;
		if (this.vida <= 0) {
			this.estado = 'derrotado';
			return { aplicado, derrotado: true };
		}
		return { aplicado, derrotado: false };
	}

	/**
	 * Avanza la pelea y devuelve la lista de cosas que el jefe hace ahora (casi siempre vacía):
	 *   { tipo: 'ataque-basico' }                un proyectil hacia el jugador
	 *   { tipo: 'ataque-fuerte', nivel }         empieza un ataque fuerte, con el reto de ese nivel de inglés
	 * `libre` dice si se puede empezar un ataque fuerte ahora (no, si el jugador ya está en otro reto): los
	 * ataques básicos no dependen de eso. Un ataque fuerte tiene prioridad sobre uno básico.
	 */
	actualizar(ahora, { libre = true } = {}) {
		if (this.estado !== 'peleando') {
			return [];
		}

		if (libre && ahora >= this.fuerteDesde && this.#hayUnAtaqueFuertePendiente()) {
			const nivel = nivelDelAtaqueFuerte(this.niveles, this.ataquesFuertesIniciados);
			this.ataquesFuertesIniciados += 1;
			this.estado = 'ataque-fuerte';
			return [{ tipo: 'ataque-fuerte', nivel }];
		}

		if (ahora >= this.proximoAtaque) {
			this.proximoAtaque = ahora + this.intervaloDeAtaque;
			return [{ tipo: 'ataque-basico' }];
		}
		return [];
	}

	/**
	 * Termina el ataque fuerte con lo que pasó en el reto. Devuelve `{ desenlace, danoAlJefe, derrotado }`
	 * (ver `desenlaceDelAtaqueFuerte`), o null si no había un ataque fuerte en curso (por ejemplo, si el jefe ya
	 * había sido derrotado mientras se respondía). Si el golpe se devuelve, el jefe pierde `devolucion` de su vida
	 * máxima (al menos 1), y eso puede derrotarlo.
	 */
	terminarAtaqueFuerte(resultado, fraccionRestante, ahora) {
		if (this.estado !== 'ataque-fuerte') {
			return null;
		}

		this.estado = 'peleando';
		this.proximoAtaque = ahora + this.pausa;
		this.fuerteDesde = ahora + this.pausa;

		const desenlace = desenlaceDelAtaqueFuerte(resultado, fraccionRestante, this.rapido);
		if (desenlace !== 'devuelto') {
			return { desenlace, danoAlJefe: 0, derrotado: false };
		}

		const { aplicado, derrotado } = this.recibirDano(
			Math.max(1, Math.round(this.vidaMaxima * this.devolucion)),
		);
		return { desenlace, danoAlJefe: aplicado, derrotado };
	}

	// ¿La vida ya bajó del umbral del próximo ataque fuerte?
	#hayUnAtaqueFuertePendiente() {
		const umbral = this.umbrales[this.ataquesFuertesIniciados];
		return umbral !== undefined && this.vida <= this.vidaMaxima * umbral;
	}
}
