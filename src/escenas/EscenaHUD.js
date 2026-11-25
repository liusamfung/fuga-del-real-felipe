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
		this.iconoDeLlave = null;
		this.textoEstadisticas = this.add
			.text(CONFIG.ANCHO - MARGEN, Y, '', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: '#c9b79c',
			})
			.setOrigin(1, 0.5);

		// El dash: una pastilla por carga (azul si está lista) y una barra que se llena al recargar.
		this.add
			.text(CONFIG.HUD.DASH_X - 8, Y, 'Dash', {
				fontFamily: 'monospace',
				fontSize: '12px',
				color: '#c9b79c',
			})
			.setOrigin(1, 0.5);
		this.graficoDelDash = this.add.graphics();

		this.jugador.on('estadisticas-cambiadas', this.#actualizar, this);
		this.events.once('shutdown', () => {
			this.jugador.off('estadisticas-cambiadas', this.#actualizar, this);
		});

		this.#actualizar();
	}

	update() {
		this.#dibujarElDash();
	}

	/** Las cargas y la recarga del dash cambian con el tiempo, así que se dibujan en cada fotograma. */
	#dibujarElDash() {
		const { Y, DASH_X } = CONFIG.HUD;
		const { dash } = this.jugador;
		const ahora = this.jugador.scene.time.now; // el dash cuenta el tiempo de la escena del juego
		const cargas = dash.cargasDisponibles(ahora);
		const ANCHO_DE_LA_BARRA = 48;
		const grafico = this.graficoDelDash;

		grafico.clear();
		for (let i = 0; i < dash.cargasMaximas; i += 1) {
			grafico.fillStyle(i < cargas ? 0x7f9bff : 0x34384a, 1);
			grafico.fillRect(DASH_X + i * 16, Y - 6, 12, 12);
		}

		const xBarra = DASH_X + dash.cargasMaximas * 16 + 4;
		grafico.fillStyle(0x34384a, 1);
		grafico.fillRect(xBarra, Y - 3, ANCHO_DE_LA_BARRA, 6);
		grafico.fillStyle(0x7f9bff, 1);
		grafico.fillRect(xBarra, Y - 3, ANCHO_DE_LA_BARRA * dash.progresoDeLaRecarga(ahora), 6);
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

		// La llave aparece justo después de los corazones.
		this.iconoDeLlave?.destroy();
		this.iconoDeLlave = null;
		if (this.jugador.tieneLlave) {
			const x = MARGEN + vidaMaxima * SEPARACION_CORAZONES + 8;
			this.iconoDeLlave = this.add.image(x, Y, 'llave').setOrigin(0, 0.5);
		}

		// `Number(...toFixed(1))` muestra 1.5 en vez de 1.500000001 por los decimales de la suma.
		this.textoEstadisticas.setText(
			`Ataque ${Number(ataque.toFixed(1))}   Velocidad ${Math.round(velocidad)}`,
		);
	}
}
