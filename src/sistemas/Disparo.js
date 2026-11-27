import { CONFIG } from '../config.js';
import { Bala } from '../entidades/Bala.js';
import { normalizar } from '../utilidades/vectores.js';

// Controla los disparos del jugador: la cadencia, la dirección y el reciclaje de las balas.
export class Disparo {
	/**
	 * @param escena la escena donde viven las balas
	 * @param bloques grupo con las paredes y obstáculos; las balas desaparecen al chocar con ellos
	 */
	constructor(escena, bloques) {
		this.escena = escena;
		this.proximoDisparo = 0;

		this.balas = escena.physics.add.group({
			classType: Bala,
			defaultKey: 'bala',
			maxSize: CONFIG.DISPARO.MAX_BALAS,
		});
		escena.physics.add.collider(this.balas, bloques, (bala) => bala.desactivar());
	}

	/**
	 * Dispara desde `origen` hacia `objetivo`, si ya pasó el tiempo de la cadencia.
	 * Ambos son objetos con `x` e `y`. `dano` es el daño de la bala (el ataque del jugador).
	 * Devuelve verdadero si salió una bala.
	 */
	intentarDisparar(origen, objetivo, dano) {
		const ahora = this.escena.time.now;
		if (ahora < this.proximoDisparo) {
			return false;
		}

		const direccion = normalizar(objetivo.x - origen.x, objetivo.y - origen.y);
		if (direccion.x === 0 && direccion.y === 0) {
			return false; // el cursor está justo sobre el origen: no hay hacia dónde disparar
		}

		const bala = this.balas.get(origen.x, origen.y);
		if (!bala) {
			return false; // todas las balas están en el aire
		}

		bala.disparar(origen.x, origen.y, direccion, dano);
		this.escena.sonido?.efecto('jugador-disparo');
		this.proximoDisparo = ahora + CONFIG.DISPARO.CADENCIA;
		return true;
	}

	/**
	 * Apaga las balas que salieron de la sala. Llamar en cada `update()`.
	 * `limites` es el rectángulo de la sala actual en el mundo: { x, y, ancho, alto }.
	 */
	actualizar(limites) {
		const { x, y, ancho, alto } = limites;

		for (const bala of this.balas.getChildren()) {
			const afuera = bala.x < x || bala.x > x + ancho || bala.y < y || bala.y > y + alto;
			if (bala.active && afuera) {
				bala.desactivar();
			}
		}
	}
}
