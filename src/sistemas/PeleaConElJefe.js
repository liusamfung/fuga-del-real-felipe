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

/**
 * Qué clase de ataque básico toca, según la vida que le queda al jefe y una `tirada` al azar de 0 a 1 (sin incluir
 * el 1):
 *   'rafaga'  varios disparos seguidos: su probabilidad sube a medida que el jefe pierde vida (0 con toda la
 *             vida, `probabilidadMaximaDeRafaga` con ninguna)
 *   'triple'  tres proyectiles a la vez en abanico, con una probabilidad fija (`probabilidadDeTriple`)
 *   'simple'  un solo proyectil, en los demás casos
 * Las dos probabilidades son independientes de la tirada: primero se mira la ráfaga y luego el triple.
 */
export function elegirElPatronBasico(
	fraccionDeVida,
	tirada,
	{ probabilidadDeTriple, probabilidadMaximaDeRafaga },
) {
	const perdida = 1 - Math.min(1, Math.max(0, fraccionDeVida));
	const probabilidadDeRafaga = probabilidadMaximaDeRafaga * perdida;

	if (tirada < probabilidadDeRafaga) {
		return 'rafaga';
	}
	if (tirada < probabilidadDeRafaga + probabilidadDeTriple) {
		return 'triple';
	}
	return 'simple';
}

/** Cuántos disparos tiene una ráfaga: `base` con toda la vida del jefe y `base + extra` con ninguna. */
export function disparosDeLaRafaga(fraccionDeVida, base, extra) {
	const perdida = 1 - Math.min(1, Math.max(0, fraccionDeVida));
	return base + Math.round(perdida * extra);
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
	 * @param probabilidadDeTriple probabilidad (0 a 1) de que un ataque básico sea de tres proyectiles a la vez
	 * @param probabilidadMaximaDeRafaga probabilidad de que sea una ráfaga cuando el jefe ya no tiene vida; con
	 *        toda la vida es 0 y sube en línea recta mientras la pierde
	 * @param disparosBaseDeLaRafaga, disparosExtraDeLaRafaga una ráfaga tiene `base` disparos con toda la vida y
	 *        `base + extra` con ninguna
	 * @param msEntreDisparosDeLaRafaga ms entre un disparo de la ráfaga y el siguiente (el siguiente ataque
	 *        básico espera a que ella termine)
	 * @param azar función sin parámetros que da un número de 0 a 1 (sin incluir el 1); se cambia en las pruebas
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
		probabilidadDeTriple = 0,
		probabilidadMaximaDeRafaga = 0,
		disparosBaseDeLaRafaga = 1,
		disparosExtraDeLaRafaga = 0,
		msEntreDisparosDeLaRafaga = 0,
		azar = Math.random,
	}) {
		this.vidaMaxima = vidaMaxima;
		this.umbrales = umbrales;
		this.intervaloDeAtaque = intervaloDeAtaque;
		this.primerAtaque = primerAtaque;
		this.niveles = nivelesDeInglesDeLosAtaquesFuertes;
		this.devolucion = devolucion;
		this.rapido = rapido;
		this.pausa = pausaTrasElAtaqueFuerte;
		this.probabilidades = { probabilidadDeTriple, probabilidadMaximaDeRafaga };
		this.disparosBase = disparosBaseDeLaRafaga;
		this.disparosExtra = disparosExtraDeLaRafaga;
		this.msEntreDisparos = msEntreDisparosDeLaRafaga;
		this.azar = azar;

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
	 *   { tipo: 'ataque-basico', patron }        un ataque básico hacia el jugador, y `patron` dice cuál:
	 *                                            'simple' (un proyectil), 'triple' (tres a la vez en abanico) o
	 *                                            'rafaga' (con `disparos`: cuántos, uno tras otro)
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
			const patron = elegirElPatronBasico(this.fraccionDeVida, this.azar(), this.probabilidades);
			if (patron === 'rafaga') {
				const disparos = disparosDeLaRafaga(
					this.fraccionDeVida,
					this.disparosBase,
					this.disparosExtra,
				);
				// El siguiente ataque espera a que termine la ráfaga, y luego su intervalo de siempre.
				this.proximoAtaque = ahora + (disparos - 1) * this.msEntreDisparos + this.intervaloDeAtaque;
				return [{ tipo: 'ataque-basico', patron, disparos }];
			}

			this.proximoAtaque = ahora + this.intervaloDeAtaque;
			return [{ tipo: 'ataque-basico', patron }];
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
