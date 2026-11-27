import { CONFIG } from '../config.js';
import { BalaEnemiga } from './BalaEnemiga.js';

// Todas las balas de los enemigos que disparan, en un solo grupo de física reciclado. Es de la escena (y no de
// cada enemigo) porque los guardias nacen y mueren con cada sala, y sus balas siguen en el aire un rato después de
// que mueren. La escena le pone las colisiones (paredes, puertas y jugador).
export class BalasEnemigas {
	constructor(escena) {
		this.grupo = escena.physics.add.group({
			classType: BalaEnemiga,
			defaultKey: 'bala-guardia-azul',
			maxSize: CONFIG.BALA_ENEMIGA.MAX,
		});
	}

	/**
	 * Lanza una bala desde `origen` (`{ x, y }`) en la dirección dada (largo 1). `datos` es el campo `disparo` del
	 * tipo de enemigo. Devuelve falso si todas las balas están en el aire.
	 */
	disparar(origen, direccion, datos) {
		const bala = this.grupo.get(origen.x, origen.y);
		if (!bala) {
			return false;
		}

		bala.lanzar(origen.x, origen.y, direccion, datos);
		return true;
	}

	/** Apaga las balas que salieron del rectángulo `{ x, y, ancho, alto }` (por una puerta abierta, por ejemplo). */
	apagarLasQueSalieron({ x, y, ancho, alto }) {
		for (const bala of this.grupo.getChildren()) {
			if (bala.active && (bala.x < x || bala.x > x + ancho || bala.y < y || bala.y > y + alto)) {
				bala.desactivar();
			}
		}
	}

	/** Apaga todas las balas que estén en el aire. */
	apagarTodas() {
		for (const bala of this.grupo.getChildren()) {
			if (bala.active) {
				bala.desactivar();
			}
		}
	}
}
