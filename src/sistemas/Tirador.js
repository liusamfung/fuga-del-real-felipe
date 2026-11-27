// El comportamiento de un enemigo que dispara (los guardias del nivel 2): cuándo se mueve, cuándo se detiene a
// apuntar y cuándo suelta el disparo. Es lógica pura, sin Phaser: el tiempo entra como el parámetro `ahora` (en
// milisegundos) y la distancia al jugador como `distancia` (en píxeles); devuelve QUÉ hacer y quien lo use (la
// clase `Enemigo`) lo ejecuta. Así se prueba entera con `npm test`.
//
// Un tirador alterna dos estados:
//   'moviendo'   se mantiene en una franja de distancia del jugador: si está más lejos que `distanciaMaxima` se
//                acerca, si está más cerca que `distanciaMinima` se aleja y en medio se queda quieto
//   'apuntando'  se detiene `aviso` ms (el jugador ve venir el disparo) y al terminar dispara
// Empieza a apuntar cuando ya le toca (`proximoDisparo`) y el jugador está a su alcance. Tras disparar espera
// `intervalo` ms hasta el siguiente.
//
// Lo que distingue a un guardia de otro (src/datos/enemigos.js) son estos números y el patrón de su disparo:
// uno mantiene la distancia y dispara una bala rápida; el otro avanza y dispara un abanico tras un aviso largo.
export class Tirador {
	/**
	 * @param intervalo ms entre un disparo y el siguiente
	 * @param aviso ms que se queda quieto apuntando antes de disparar (0: dispara en cuanto le toca)
	 * @param alcance distancia máxima (px) a la que empieza a apuntar
	 * @param distanciaMinima más cerca que esto, se aleja del jugador
	 * @param distanciaMaxima más lejos que esto, se acerca al jugador
	 * @param primerDisparo el instante (en ms, el mismo reloj que `ahora`) desde el que puede apuntar por primera vez
	 */
	constructor({ intervalo, aviso, alcance, distanciaMinima, distanciaMaxima, primerDisparo }) {
		this.intervalo = intervalo;
		this.aviso = aviso;
		this.alcance = alcance;
		this.distanciaMinima = distanciaMinima;
		this.distanciaMaxima = distanciaMaxima;

		this.estado = 'moviendo';
		this.proximoDisparo = primerDisparo;
		this.apuntaHasta = 0;
	}

	/**
	 * Avanza un fotograma y devuelve `{ movimiento, apuntando, disparar }`:
	 *   movimiento  'acercarse', 'alejarse' o 'quieto'
	 *   apuntando   verdadero mientras se detiene a apuntar (para mostrarlo: parpadea, se queda quieto)
	 *   disparar    verdadero en el fotograma exacto en que suelta el disparo
	 */
	actualizar(ahora, distancia) {
		if (this.estado === 'apuntando') {
			if (ahora < this.apuntaHasta) {
				return { movimiento: 'quieto', apuntando: true, disparar: false };
			}
			return this.#soltarElDisparo(ahora);
		}

		if (ahora >= this.proximoDisparo && distancia <= this.alcance) {
			if (this.aviso <= 0) {
				return this.#soltarElDisparo(ahora);
			}
			this.estado = 'apuntando';
			this.apuntaHasta = ahora + this.aviso;
			return { movimiento: 'quieto', apuntando: true, disparar: false };
		}

		return { movimiento: this.#movimientoPara(distancia), apuntando: false, disparar: false };
	}

	#soltarElDisparo(ahora) {
		this.estado = 'moviendo';
		this.proximoDisparo = ahora + this.intervalo;
		return { movimiento: 'quieto', apuntando: false, disparar: true };
	}

	#movimientoPara(distancia) {
		if (distancia > this.distanciaMaxima) {
			return 'acercarse';
		}
		if (distancia < this.distanciaMinima) {
			return 'alejarse';
		}
		return 'quieto';
	}
}
