import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';

// Un cartel que tapa el juego cuando termina algo (perdiste, nivel completado, ganaste) y pide que el jugador pulse un
// botón para seguir. Lo lanza `EscenaJuego`:
//
//   scene.launch(ESCENAS.CARTEL, { cartel, alAceptar })
//
// `cartel` es `{ titulo, subtitulo, boton, color }` (ver `cartelDe` en src/datos/carteles.js) y `alAceptar` se llama una vez
// cuando el jugador acepta, con un clic en el botón o con ENTER. El botón no responde durante los primeros instantes
// (`RETRASO_PARA_ACEPTAR`): así no se acepta sin querer si el jugador seguía disparando o tecleando cuando salió.
//
// Es solo dibujo y entrada: qué pasa después (empezar el nivel 1, pasar al 2…) lo decide quien lo lanza.
export class EscenaCartel extends Phaser.Scene {
	constructor() {
		super(ESCENAS.CARTEL);
	}

	init({ cartel, alAceptar }) {
		this.cartel = cartel;
		this.alAceptar = alAceptar;
		this.habilitado = false;
		this.aceptado = false;
	}

	create() {
		const { ANCHO, ALTO } = CONFIG;
		const { cartel } = this;
		const { ANCHO: anchoDelPanel, ALTO: altoDelPanel, BOTON_ANCHO, BOTON_ALTO } = CONFIG.CARTEL;
		const centroX = ANCHO / 2;
		const centroY = ALTO / 2;
		const colorEnTexto = `#${cartel.color.toString(16).padStart(6, '0')}`;

		// Con el cartel abierto, el cursor vuelve a ser una flecha (en el juego es una mira).
		this.input.setDefaultCursor('default');

		// Una capa oscura que tapa el juego y se come los clics (que no lleguen a nada de abajo).
		this.add.rectangle(0, 0, ANCHO, ALTO, 0x000000, 0.78).setOrigin(0).setInteractive();

		const panel = this.add
			.rectangle(centroX, centroY, anchoDelPanel, altoDelPanel, 0x14110e, 0.97)
			.setStrokeStyle(4, cartel.color);
		const titulo = this.add
			.text(centroX, centroY - 85, cartel.titulo, {
				fontFamily: 'monospace',
				fontSize: '54px',
				fontStyle: 'bold',
				color: colorEnTexto,
			})
			.setOrigin(0.5);
		const subtitulo = this.add
			.text(centroX, centroY - 10, cartel.subtitulo, {
				fontFamily: 'monospace',
				fontSize: '22px',
				color: '#e8dcc6',
				align: 'center',
				wordWrap: { width: anchoDelPanel - 60 },
			})
			.setOrigin(0.5);

		this.fondoDelBoton = this.add
			.rectangle(centroX, centroY + 85, BOTON_ANCHO, BOTON_ALTO, 0x2a2420)
			.setStrokeStyle(3, cartel.color);
		this.textoDelBoton = this.add
			.text(centroX, centroY + 85, cartel.boton, {
				fontFamily: 'monospace',
				fontSize: '24px',
				fontStyle: 'bold',
				color: '#ffffff',
			})
			.setOrigin(0.5);
		this.pista = this.add
			.text(centroX, centroY + 135, 'o pulsa ENTER', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: '#9a8d77',
			})
			.setOrigin(0.5);

		// Al aparecer, el cartel entra con un pequeño crecimiento y el botón queda apagado (a 0,35) hasta poder aceptarse.
		const botonYPista = [this.fondoDelBoton, this.textoDelBoton, this.pista];
		[panel, titulo, subtitulo, ...botonYPista].forEach((objeto) => objeto.setAlpha(0));
		panel.setScale(0.92);
		this.tweens.add({ targets: [panel, titulo, subtitulo], alpha: 1, duration: 250 });
		this.tweens.add({ targets: panel, scale: 1, duration: 250, ease: 'Back.easeOut' });
		this.tweens.add({ targets: botonYPista, alpha: 0.35, duration: 250 });

		this.fondoDelBoton.on('pointerover', () => this.#resaltar(true));
		this.fondoDelBoton.on('pointerout', () => this.#resaltar(false));
		this.fondoDelBoton.on('pointerdown', () => this.#aceptar());
		this.input.keyboard.on('keydown-ENTER', () => this.#aceptar());
		this.input.keyboard.on('keydown-NUMPAD_ENTER', () => this.#aceptar());

		// Pasado el retraso, el botón se enciende y empieza a responder.
		this.time.delayedCall(CONFIG.CARTEL.RETRASO_PARA_ACEPTAR, () => {
			this.habilitado = true;
			this.fondoDelBoton.setInteractive({ useHandCursor: true });
			this.tweens.add({
				targets: [this.fondoDelBoton, this.textoDelBoton, this.pista],
				alpha: 1,
				duration: 200,
			});
		});
	}

	#resaltar(encima) {
		if (this.habilitado) {
			this.fondoDelBoton.setFillStyle(encima ? 0x4a3f36 : 0x2a2420);
		}
	}

	// Un clic en el botón o ENTER. Cierra el cartel y le avisa al juego (una sola vez, y solo si el botón ya está activo).
	#aceptar() {
		if (!this.habilitado || this.aceptado) {
			return;
		}

		this.aceptado = true;
		this.scene.stop();
		this.alAceptar?.();
	}
}
