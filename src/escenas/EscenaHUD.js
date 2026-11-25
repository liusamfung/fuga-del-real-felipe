import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';

// La interfaz: los corazones de vida y las estadísticas. Es una escena aparte que se dibuja
// encima del juego, así los efectos de la cámara del juego (temblor, cámara lenta) no la afectan.
// La lanza `EscenaJuego`, que le pasa el jugador: `scene.launch(ESCENAS.HUD, { jugador })`.
export class EscenaHUD extends Phaser.Scene {
	constructor() {
		super(ESCENAS.HUD);
	}

	init({ jugador }) {
		this.jugador = jugador;
	}

	create() {
		const { MARGEN, Y } = CONFIG.HUD;

		// Franja oscura detrás de la interfaz: así se lee sobre cualquier textura de pared.
		this.add.rectangle(0, 0, CONFIG.ANCHO, CONFIG.SALA.CASILLA, 0x000000, 0.6).setOrigin(0, 0);

		this.corazones = [];
		this.textoEstadisticas = this.add
			.text(CONFIG.ANCHO - MARGEN, Y, '', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: '#c9b79c',
			})
			.setOrigin(1, 0.5);

		this.jugador.on('estadisticas-cambiadas', this.#actualizar, this);
		this.events.once('shutdown', () => {
			this.jugador.off('estadisticas-cambiadas', this.#actualizar, this);
		});

		this.#actualizar();
	}

	#actualizar() {
		const { MARGEN, Y, SEPARACION_CORAZONES } = CONFIG.HUD;
		const { vida, vidaMaxima, ataque, velocidad } = this.jugador.estadisticas;

		for (const corazon of this.corazones) {
			corazon.destroy();
		}
		this.corazones = [];
		for (let i = 0; i < vidaMaxima; i += 1) {
			const clave = i < vida ? 'corazon-lleno' : 'corazon-vacio';
			const x = MARGEN + i * SEPARACION_CORAZONES;
			this.corazones.push(this.add.image(x, Y, clave).setOrigin(0, 0.5));
		}

		// `Number(...toFixed(1))` muestra 1.5 en vez de 1.500000001 por los decimales de la suma.
		this.textoEstadisticas.setText(
			`Ataque ${Number(ataque.toFixed(1))}   Velocidad ${Math.round(velocidad)}`,
		);
	}
}
