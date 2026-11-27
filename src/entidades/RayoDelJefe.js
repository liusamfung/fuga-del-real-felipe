import { CONFIG } from '../config.js';

// El rayo verde del ataque fuerte del jefe: sale de él y llega hasta el final de la sala, en línea recta.
// Tiene tres momentos:
//   1. `apuntar`: cuando aparece el reto de inglés se fija por dónde va a salir. Se ve una línea fina y una bola de
//      energía que crece en el jefe, para que se vea venir (y para que se entienda que no se puede esquivar
//      caminando: la dirección ya quedó fijada).
//   2. `disparar`: cuando termina el reto el rayo se abre y se queda un instante. Si el jugador falló, el golpe
//      se aplica en ese mismo momento (lo decide quien lo dispara); si acertó, lo dispara con un pequeño
//      retraso para que primero se vea el dash.
//   3. `ocultar`: se apaga todo (por ejemplo, si el jefe cae a mitad del reto).
//
// Es solo dibujo: no tiene cuerpo físico. El daño lo decide `PeleaConElJefe` y lo aplica la escena.
// La franja del rayo es una imagen que se repite (`TileSprite`) y se desplaza, para que parezca que la energía
// corre. Las texturas `rayo-jefe` y `rayo-cabeza` son provisionales (src/datos/recursos.js).
export class RayoDelJefe {
	constructor(escena) {
		this.escena = escena;
		const profundidad = CONFIG.DISPARO.PROFUNDIDAD_BALAS;

		this.aviso = escena.add
			.rectangle(0, 0, 10, CONFIG.JEFE.RAYO.AVISO_ANCHO, 0x9ed38a, 0.55)
			.setOrigin(0, 0.5)
			.setDepth(profundidad)
			.setVisible(false);
		// La franja mide lo que el rayo (largo) por el ancho del rayo; la textura mide 24 px de alto.
		this.franja = escena.add
			.tileSprite(0, 0, 10, 24, 'rayo-jefe')
			.setOrigin(0, 0.5)
			.setDepth(profundidad)
			.setVisible(false);
		this.cabeza = escena.add
			.image(0, 0, 'rayo-cabeza')
			.setDepth(profundidad + 1)
			.setVisible(false);

		this.animaciones = []; // los tweens en marcha, para poder pararlos
		this.pendiente = null; // el disparo que espera su retraso
	}

	/** Fija por dónde saldrá el rayo y muestra el aviso. `apuntado` es `{ origen, direccion, largo }`. */
	apuntar({ origen, direccion, largo }) {
		this.ocultar();

		const angulo = Math.atan2(direccion.y, direccion.x);
		this.aviso
			.setPosition(origen.x, origen.y)
			.setRotation(angulo)
			.setSize(largo, CONFIG.JEFE.RAYO.AVISO_ANCHO);
		this.aviso.setVisible(true).setAlpha(0.55);
		this.cabeza.setPosition(origen.x, origen.y).setVisible(true).setAlpha(1).setScale(0.6);

		// La línea parpadea y la bola late: es un aviso de que algo se está cargando.
		this.#animar({ targets: this.aviso, alpha: 0.15, duration: 260, yoyo: true, repeat: -1 });
		this.#animar({ targets: this.cabeza, scale: 1.3, duration: 320, yoyo: true, repeat: -1 });
	}

	/**
	 * Abre el rayo. Con `retraso` (ms) espera antes de aparecer: se usa cuando el jugador hace su dash, para que
	 * se vea que el dash sale primero. Después se cierra solo.
	 */
	disparar(apuntado, { retraso = 0 } = {}) {
		const abrir = () => {
			this.pendiente = null;
			this.#abrir(apuntado);
		};

		if (retraso > 0) {
			this.pendiente = this.escena.time.delayedCall(retraso, abrir);
		} else {
			abrir();
		}
	}

	/** Apaga el aviso, el rayo y la bola, y detiene sus animaciones. */
	ocultar() {
		this.pendiente?.remove(false);
		this.pendiente = null;
		for (const animacion of this.animaciones) {
			animacion.stop();
		}
		this.animaciones = [];
		this.aviso.setVisible(false);
		this.franja.setVisible(false);
		this.cabeza.setVisible(false);
	}

	#abrir({ origen, direccion, largo }) {
		const { ANCHO, CRECE, DURACION } = CONFIG.JEFE.RAYO;
		const angulo = Math.atan2(direccion.y, direccion.x);

		for (const animacion of this.animaciones) {
			animacion.stop();
		}
		this.animaciones = [];
		this.aviso.setVisible(false);

		// La textura mide 24 px de alto y se amplía por un número entero (pixel art: sin borrosidad) hasta el ancho
		// del rayo. Con esa ampliación, la franja mide `largo / escala` en sus propias unidades.
		const escala = ANCHO / 24;
		this.franja
			.setPosition(origen.x, origen.y)
			.setRotation(angulo)
			.setSize(largo / escala, 24);
		this.franja.setVisible(true).setAlpha(1).setScale(escala, 0.1);
		this.franja.tilePositionX = 0;
		this.cabeza.setPosition(origen.x, origen.y).setVisible(true).setAlpha(1).setScale(0.6);

		// Se abre de golpe, se queda con todo su ancho y se cierra. La energía corre a lo largo (`tilePositionX`).
		this.#animar({
			targets: this.franja,
			scaleY: escala,
			duration: CRECE,
			ease: 'Cubic.easeOut',
			hold: DURACION,
			yoyo: true,
			onYoyo: () => this.#cerrar(),
			onComplete: () => this.ocultar(),
		});
		this.#animar({ targets: this.franja, tilePositionX: -64, duration: 160, repeat: -1 });
		this.#animar({ targets: this.cabeza, scale: 2.2, duration: CRECE, ease: 'Cubic.easeOut' });
	}

	// Mientras se cierra, la bola se apaga también.
	#cerrar() {
		this.#animar({ targets: this.cabeza, alpha: 0, scale: 0.6, duration: CONFIG.JEFE.RAYO.CRECE });
	}

	#animar(configuracion) {
		const animacion = this.escena.tweens.add(configuracion);
		this.animaciones.push(animacion);
		return animacion;
	}
}
