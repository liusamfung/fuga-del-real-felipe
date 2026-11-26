import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// El nido de ratas de una sala: ocupa el lugar de una de sus cajas, es sólido (el jugador y los enemigos no
// lo atraviesan) y las balas y la granada lo dañan. Mientras esté en pie, la sala suelta ratas grises cada
// cierto tiempo y no se limpia: hay que romperlo (ver `EscenaJuego`).
//
// Avisa con el evento `roto` cuando se le acaba la vida. Es un cuerpo estático: se agrega a un grupo estático
// de física (`grupo.add(nido)`), que es quien le da el cuerpo, igual que la puerta. Su barra de vida se ve
// solo después del primer golpe.
export class Nido extends Phaser.Physics.Arcade.Sprite {
	/** @param x, y el centro del nido, en el mundo */
	constructor(escena, x, y) {
		super(escena, x, y, 'nido');
		escena.add.existing(this);

		this.vida = CONFIG.NIDO.VIDA;
		this.vidaMaxima = CONFIG.NIDO.VIDA;
		this.setDepth(y + CONFIG.NIDO.ALTO / 2); // igual que las cajas, para ir delante o detrás del jugador
		this.barra = escena.add.graphics().setDepth(CONFIG.PROFUNDIDAD_MENSAJES);
	}

	/** Resta vida. Si llega a cero, el nido se rompe; si no, parpadea en blanco un instante. */
	recibirDano(cantidad) {
		if (!this.active) {
			return;
		}

		this.vida -= cantidad;
		if (this.vida <= 0) {
			this.romper();
			return;
		}

		this.#dibujarLaBarra();
		this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
		this.scene.time.delayedCall(CONFIG.NIDO.DESTELLO, () => {
			if (this.active) {
				this.clearTint();
			}
		});
	}

	romper() {
		this.emit('roto', this);
		this.barra.destroy();
		this.destroy(); // también lo saca del grupo estático y le quita el cuerpo
	}

	// Una barra fina sobre el nido, que se vacía de derecha a izquierda.
	#dibujarLaBarra() {
		const ancho = CONFIG.NIDO.ANCHO;
		const izquierda = this.x - ancho / 2;
		const arriba = this.y - CONFIG.NIDO.ALTO / 2 - 10;

		this.barra.clear();
		this.barra.fillStyle(0x34384a, 1);
		this.barra.fillRect(izquierda, arriba, ancho, 5);
		this.barra.fillStyle(0xc0392b, 1);
		this.barra.fillRect(izquierda, arriba, ancho * Math.max(0, this.vida / this.vidaMaxima), 5);
	}
}
