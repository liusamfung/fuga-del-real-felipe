import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// El jefe de un piso. Por ahora solo se VE: flota en su sala. No tiene vida, no ataca y no choca con
// nada (ni con el jugador ni con las balas): sus ataques y su vida se deciden en el paso 10 de la hoja
// de ruta (docs/mapa-del-proyecto.md). Es un sprite de Phaser sin cuerpo físico.
//
// `clave` es la hoja de sprites del jefe y su animación se llama `<clave>-flotar` (ver
// src/datos/animaciones.js). Sus cuadros miden 32 x 32 y se muestran ampliados (`JEFE.ESCALA`) para que
// se vea más grande que el jugador; con pixel art la ampliación es por números enteros, sin borrosidad.
export class Jefe extends Phaser.GameObjects.Sprite {
	constructor(escena, x, y, clave) {
		super(escena, x, y, clave);
		escena.add.existing(this);

		this.setScale(CONFIG.JEFE.ESCALA);
		this.setDepth(y); // igual que los demás personajes, el que está más abajo se dibuja delante
		this.anims.play(`${clave}-flotar`);
	}
}
