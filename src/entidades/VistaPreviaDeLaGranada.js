import { CONFIG } from '../config.js';
import { tramosDeRayas } from '../utilidades/explosion.js';

// La vista previa de la granada: mientras el jugador responde el reto, una línea de rayas va del jugador al punto donde
// caería la granada y un círculo muestra hasta dónde llegaría la explosión. Así se ve dónde va a impactar (como el
// aviso del rayo de los jefes). Es solo dibujo: quien la usa le dice en cada fotograma por dónde pasa y la oculta
// cuando el reto termina.
export class VistaPreviaDeLaGranada {
	constructor(escena) {
		this.escena = escena;
		this.grafico = escena.add
			.graphics()
			.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS)
			.setVisible(false);
	}

	/** Dibuja la línea de `origen` a `destino` y el círculo de la explosión (de `radio` px) alrededor del destino. */
	mostrar(origen, destino, radio) {
		const { COLOR, RAYA, HUECO } = CONFIG.PODERES.GRANADA.VISTA_PREVIA;
		const grafico = this.grafico;

		grafico.clear();
		// El círculo: un relleno suave y un borde, para ver de un vistazo qué quedará dentro.
		grafico.fillStyle(COLOR, 0.14);
		grafico.fillCircle(destino.x, destino.y, radio);
		grafico.lineStyle(2, COLOR, 0.9);
		grafico.strokeCircle(destino.x, destino.y, radio);

		// La línea de rayas hasta el punto de impacto, y una marca donde cae.
		grafico.lineStyle(3, COLOR, 0.85);
		for (const { desde, hasta } of tramosDeRayas(origen, destino, RAYA, HUECO)) {
			grafico.lineBetween(desde.x, desde.y, hasta.x, hasta.y);
		}
		grafico.fillStyle(COLOR, 1);
		grafico.fillCircle(destino.x, destino.y, 4);

		// Late despacio, igual que el aviso del rayo del jefe: es una advertencia de que algo está cargado.
		grafico.setAlpha(0.75 + 0.25 * Math.sin(this.escena.time.now / 110));
		grafico.setVisible(true);
	}

	ocultar() {
		this.grafico.clear();
		this.grafico.setVisible(false);
	}
}
