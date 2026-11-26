import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { TIPOS_DE_ENEMIGO } from '../datos/enemigos.js';
import { normalizar } from '../utilidades/vectores.js';

// Un enemigo: el débil de siempre o una de las ratas. Todos caminan en línea recta hacia el jugador; lo que
// los distingue (dibujo, vida, velocidad y daño) viene del tipo (src/datos/enemigos.js).
// Avisa con el evento `muerto` cuando se le acaba la vida; así la escena sabe cuándo la sala
// quedó limpia sin tener que contar enemigos en cada fotograma.
export class Enemigo extends Phaser.Physics.Arcade.Sprite {
	/** `tipo` es una de las claves de `TIPOS_DE_ENEMIGO` ('debil', 'rata-gris', 'rata-blanca'…). */
	constructor(escena, x, y, tipo) {
		const datos = TIPOS_DE_ENEMIGO[tipo];
		if (!datos) {
			throw new Error(`Tipo de enemigo desconocido: "${tipo}"`);
		}

		super(escena, x, y, datos.textura);
		escena.add.existing(this);
		escena.physics.add.existing(this);

		const { ANCHO, ALTO, CUERPO_ANCHO, CUERPO_ALTO } = CONFIG.ENEMIGO;
		this.tipo = tipo;
		this.vida = datos.vida;
		this.velocidad = datos.velocidad;
		this.dano = datos.dano; // lo que le quita al jugador al tocarlo

		// El cuerpo está centrado a lo ancho y pegado al borde de abajo, pero es alto (ver config.js).
		this.body.setSize(CUERPO_ANCHO, CUERPO_ALTO);
		this.body.setOffset((ANCHO - CUERPO_ANCHO) / 2, ALTO - CUERPO_ALTO);

		this.anims.play(datos.animacion);
	}

	/** Camina en línea recta hacia el objetivo (un objeto con cuerpo físico, como el jugador). */
	perseguir(objetivo) {
		const direccion = normalizar(
			objetivo.body.center.x - this.body.center.x,
			objetivo.body.center.y - this.body.center.y,
		);
		this.setVelocity(direccion.x * this.velocidad, direccion.y * this.velocidad);
		this.setDepth(this.body.bottom);
	}

	/** Resta vida. Si llega a cero, el enemigo muere; si no, parpadea en blanco un instante. */
	recibirDano(cantidad) {
		if (!this.active) {
			return;
		}

		this.vida -= cantidad;
		if (this.vida <= 0) {
			this.morir();
		} else {
			this.#destellar();
		}
	}

	morir() {
		this.emit('muerto', this);
		this.destroy();
	}

	#destellar() {
		// En Phaser 4 el relleno de color se hace con el modo de tinte FILL (setTintFill ya no existe).
		this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
		this.scene.time.delayedCall(CONFIG.ENEMIGO.DESTELLO, () => {
			if (this.active) {
				this.clearTint();
			}
		});
	}
}
