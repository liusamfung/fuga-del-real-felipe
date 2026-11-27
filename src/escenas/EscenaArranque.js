import Phaser from 'phaser';
import { ESCENAS } from '../config.js';
import { crearAnimaciones } from '../sistemas/Animaciones.js';
import { cargarRecursos, generarRecursosProvisionales } from '../sistemas/Recursos.js';

// Primera escena del juego: prepara los recursos y pasa a la portada (`EscenaPortada`), que a su vez empieza el juego.
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

		// Solo en desarrollo (`npm run dev`): con ?voz se abre la prueba de voz (docs/prueba-de-voz.md) y con ?ingles la
		// prueba de voz en inglés (docs/prueba-de-voz-ingles.md), en vez del juego. En el juego compilado esto no existe.
		if (import.meta.env.DEV) {
			const parametros = new URLSearchParams(window.location.search);
			if (parametros.has('ingles')) {
				this.scene.start(ESCENAS.PRUEBA_INGLES);
				return;
			}
			if (parametros.has('voz')) {
				this.scene.start(ESCENAS.PRUEBA_VOZ);
				return;
			}
		}
		this.scene.start(ESCENAS.PORTADA);
	}
}
