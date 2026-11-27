import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';

// La interfaz: los corazones de vida y las estadísticas. Es una escena aparte que se dibuja
// encima del juego, así los efectos de la cámara del juego (temblor, cámara lenta) no la afectan.
// La lanza `EscenaJuego`, que le pasa el jugador, los poderes (la granada) y la pelea con el jefe:
// `scene.launch(ESCENAS.HUD, { jugador, poderes, pelea })`.
export class EscenaHUD extends Phaser.Scene {
	constructor() {
		super(ESCENAS.HUD);
	}

	init({ jugador, poderes, pelea }) {
		this.jugador = jugador;
		this.poderes = poderes;
		this.pelea = pelea;
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

		// La granada: la tecla que la pide, una pastilla (naranja si está lista) y una barra de recarga.
		this.add
			.text(CONFIG.HUD.GRANADA_X - 8, Y, 'G', {
				fontFamily: 'monospace',
				fontSize: '12px',
				color: '#c9b79c',
			})
			.setOrigin(1, 0.5);
		this.graficoDeLaGranada = this.add.graphics();

		// La vida del jefe: una barra abajo y al centro, que solo se ve mientras dura la pelea.
		this.graficoDelJefe = this.add.graphics();
		this.nombreDelJefe = this.add
			.text(CONFIG.ANCHO / 2, CONFIG.ALTO - 40, 'JEFE', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: '#c9b79c',
				stroke: '#000000',
				strokeThickness: 3,
			})
			.setOrigin(0.5)
			.setVisible(false);

		this.jugador.on('estadisticas-cambiadas', this.#actualizar, this);
		this.events.once('shutdown', () => {
			this.jugador.off('estadisticas-cambiadas', this.#actualizar, this);
		});

		this.#actualizar();
	}

	update() {
		this.#dibujarElDash();
		this.#dibujarLaGranada();
		this.#dibujarLaVidaDelJefe();
	}

	/** La barra de vida del jefe, mientras pelea: roja, con un marco; se ve más corta a cada golpe. */
	#dibujarLaVidaDelJefe() {
		const grafico = this.graficoDelJefe;
		const { pelea } = this;
		const peleando = pelea.estado === 'peleando' || pelea.estado === 'ataque-fuerte';

		grafico.clear();
		this.nombreDelJefe.setVisible(peleando);
		if (!peleando) {
			return;
		}

		const ancho = 420;
		const x = (CONFIG.ANCHO - ancho) / 2;
		const y = CONFIG.ALTO - 28;
		grafico.fillStyle(0x000000, 0.7);
		grafico.fillRect(x - 3, y - 3, ancho + 6, 18);
		grafico.fillStyle(0x34384a, 1);
		grafico.fillRect(x, y, ancho, 12);
		grafico.fillStyle(0xc0392b, 1);
		grafico.fillRect(x, y, ancho * pelea.fraccionDeVida, 12);
	}

	/** La granada: la pastilla es naranja si se puede usar y la barra se llena mientras recarga. */
	#dibujarLaGranada() {
		const { Y, GRANADA_X } = CONFIG.HUD;
		const { granada } = this.poderes;
		const ahora = this.jugador.scene.time.now; // igual que el dash: el reloj de la escena del juego
		const grafico = this.graficoDeLaGranada;

		grafico.clear();
		grafico.fillStyle(granada.estaLista(ahora) ? 0xff9a3c : 0x34384a, 1);
		grafico.fillRect(GRANADA_X, Y - 6, 12, 12);
		grafico.fillStyle(0x34384a, 1);
		grafico.fillRect(GRANADA_X + 16, Y - 3, 36, 6);
		grafico.fillStyle(0xff9a3c, 1);
		grafico.fillRect(GRANADA_X + 16, Y - 3, 36 * granada.progresoDeLaRecarga(ahora), 6);
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
