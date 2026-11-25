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

		// Con ?voz en la dirección se abre la prueba de voz (docs/prueba-de-voz.md) en vez del juego.
		const pruebaDeVoz = new URLSearchParams(window.location.search).has('voz');
		this.scene.start(pruebaDeVoz ? ESCENAS.PRUEBA_VOZ : ESCENAS.JUEGO);
	}
}
