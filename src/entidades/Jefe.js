import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { normalizar } from '../utilidades/vectores.js';
import { ProyectilDelJefe } from './ProyectilDelJefe.js';

// El jefe de un piso: flota en su sala, tiene un cuerpo sólido (las balas lo golpean y el jugador no lo
// atraviesa) y lanza proyectiles. Su vida y cuándo ataca las decide `PeleaConElJefe` (lógica pura); esta clase
// solo es el cuerpo: se dibuja, destella al recibir un golpe y dispara cuando se lo piden.
//
// `clave` es la hoja de sprites del jefe y su animación se llama `<clave>-flotar` (ver
// src/datos/animaciones.js). Sus cuadros miden 32 x 32 y se muestran ampliados (`JEFE.ESCALA`) para que
// se vea más grande que el jugador; con pixel art la ampliación es por números enteros, sin borrosidad.
export class Jefe extends Phaser.Physics.Arcade.Sprite {
	constructor(escena, x, y, clave) {
		super(escena, x, y, clave);
		escena.add.existing(this);
		escena.physics.add.existing(this);

		const { ESCALA, CUERPO_ANCHO, CUERPO_ALTO } = CONFIG.JEFE;
		this.setScale(ESCALA);
		this.setDepth(y); // igual que los demás personajes, el que está más abajo se dibuja delante
		this.setImmovable(true); // el jugador no lo empuja
		// El tamaño del cuerpo se da en píxeles del dibujo; Phaser lo amplía con la escala. Centrado.
		this.body.setSize(CUERPO_ANCHO, CUERPO_ALTO);
		this.body.setOffset(
			(this.frame.realWidth - CUERPO_ANCHO) / 2,
			(this.frame.realHeight - CUERPO_ALTO) / 2,
		);

		this.anims.play(`${clave}-flotar`);

		this.proyectiles = escena.physics.add.group({
			classType: ProyectilDelJefe,
			defaultKey: 'proyectil-jefe',
			maxSize: CONFIG.JEFE.PROYECTIL.MAX,
		});
	}

	/** Lanza un proyectil hacia el objetivo (un objeto con cuerpo físico, como el jugador). */
	lanzarUnProyectil(objetivo) {
		const direccion = normalizar(
			objetivo.body.center.x - this.body.center.x,
			objetivo.body.center.y - this.body.center.y,
		);
		if (direccion.x === 0 && direccion.y === 0) {
			return false; // el objetivo está justo encima: no hay hacia dónde lanzar
		}

		const proyectil = this.proyectiles.get(this.body.center.x, this.body.center.y);
		if (!proyectil) {
			return false; // todos los proyectiles están en el aire
		}

		proyectil.lanzar(this.body.center.x, this.body.center.y, direccion);
		return true;
	}

	/** Parpadea en blanco un instante (al recibir un golpe). */
	destellar() {
		this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
		this.scene.time.delayedCall(CONFIG.ENEMIGO.DESTELLO, () => {
			if (this.active) {
				this.clearTint();
			}
		});
	}

	/** Apaga todos los proyectiles que estén en el aire (al terminar la pelea). */
	apagarLosProyectiles() {
		for (const proyectil of this.proyectiles.getChildren()) {
			if (proyectil.active) {
				proyectil.desactivar();
			}
		}
	}
}
