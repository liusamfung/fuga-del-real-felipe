import Phaser from 'phaser';
import { ESCENAS } from '../config.js';
import { crearAnimaciones } from '../sistemas/Animaciones.js';
import { cargarRecursos, generarRecursosProvisionales } from '../sistemas/Recursos.js';

// Primera escena del juego: prepara los recursos y pasa al juego.
// Más adelante pasará a la portada en vez de ir directo al juego.
export class EscenaArranque extends Phaser.Scene {
	constructor() {
		super(ESCENAS.ARRANQUE);
	}

	preload() {
		cargarRecursos(this);
	}

	create() {
		generarRecursosProvisionales(this);
		crearAnimaciones(this);

		// Con ?voz se abre la prueba de voz (docs/prueba-de-voz.md) y con ?ingles la prueba de voz en
		// inglés (docs/prueba-de-voz-ingles.md), en vez del juego.
		const parametros = new URLSearchParams(window.location.search);
		if (parametros.has('ingles')) {
			this.scene.start(ESCENAS.PRUEBA_INGLES);
		} else {
			this.scene.start(parametros.has('voz') ? ESCENAS.PRUEBA_VOZ : ESCENAS.JUEGO);
		}
	}
}
