import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import {
	CREDITOS,
	SUBTITULO_DEL_JUEGO,
	TEXTO_PARA_COMENZAR,
	TITULO_DEL_JUEGO,
} from '../datos/creditos.js';
import { cuadroQuietoDelJugador } from '../datos/animaciones.js';
import { FOTOGRAMAS_TILESET } from '../datos/recursos.js';

// La portada: lo primero que se ve al abrir el juego. Muestra el nombre del juego, quiénes lo hicieron y «Pulsa ENTER para
// comenzar»; con ENTER empieza el nivel 1 (`EscenaJuego`). Los textos están en src/datos/creditos.js.
//
// Es solo dibujo y entrada: no hay lógica de juego aquí. Además de mostrar la portada, la pulsación de ENTER es la primera
// interacción del jugador con la página, que es lo que el navegador pide para dejar sonar la música del nivel.
export class EscenaPortada extends Phaser.Scene {
	constructor() {
		super(ESCENAS.PORTADA);
	}

	create() {
		const { ANCHO, ALTO } = CONFIG;
		const { FUNDIDO, COLOR_DEL_TITULO, COLOR_DEL_TEXTO, COLOR_APAGADO } = CONFIG.PORTADA;
		const centroX = ANCHO / 2;
		this.comenzando = false;

		this.input.setDefaultCursor('default');
		this.cameras.main.fadeIn(FUNDIDO, 0, 0, 0);

		// El fondo: el suelo de la prisión del nivel 1, oscurecido para que se lean los textos.
		this.add.tileSprite(0, 0, ANCHO, ALTO, 'tileset', FOTOGRAMAS_TILESET.sueloRayas).setOrigin(0);
		this.add.rectangle(0, 0, ANCHO, ALTO, 0x000000, 0.68).setOrigin(0);
		this.add
			.rectangle(centroX, ALTO / 2, ANCHO - 48, ALTO - 48)
			.setStrokeStyle(3, COLOR_DEL_TITULO, 0.8);

		// El título, en dos líneas, y debajo el lugar y la época.
		const colorDelTitulo = `#${COLOR_DEL_TITULO.toString(16).padStart(6, '0')}`;
		TITULO_DEL_JUEGO.forEach((linea, i) => {
			this.add
				.text(centroX, 84 + i * 68, linea, {
					fontFamily: 'monospace',
					fontSize: '66px',
					fontStyle: 'bold',
					color: colorDelTitulo,
					stroke: '#000000',
					strokeThickness: 8,
				})
				.setOrigin(0.5);
		});
		this.add
			.text(centroX, 216, SUBTITULO_DEL_JUEGO, {
				fontFamily: 'monospace',
				fontSize: '20px',
				color: COLOR_APAGADO,
			})
			.setOrigin(0.5);

		// Tres personajes del juego de adorno: el jugador en el centro y los dos jefes a los lados, flotando.
		this.add
			.sprite(centroX - 200, 312, 'jefe-1')
			.setScale(3)
			.play('jefe-1-flotar');
		this.add
			.sprite(centroX + 200, 312, 'jefe-2')
			.setScale(3)
			.play('jefe-2-flotar');
		this.add.sprite(centroX, 316, 'jugador', cuadroQuietoDelJugador('abajo')).setScale(3);

		// Los integrantes: cada grupo con su rol y, debajo, los nombres.
		this.add
			.text(centroX, 408, 'INTEGRANTES', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: COLOR_APAGADO,
			})
			.setOrigin(0.5);
		CREDITOS.forEach(({ rol, nombres }, i) => {
			const y = 440 + i * 58;
			this.add
				.text(centroX, y, rol, { fontFamily: 'monospace', fontSize: '15px', color: COLOR_APAGADO })
				.setOrigin(0.5);
			this.add
				.text(centroX, y + 26, nombres.join('   ·   '), {
					fontFamily: 'monospace',
					fontSize: '24px',
					fontStyle: 'bold',
					color: COLOR_DEL_TEXTO,
				})
				.setOrigin(0.5);
		});

		// «Pulsa ENTER para comenzar», que parpadea despacio para llamar la atención.
		const pista = this.add
			.text(centroX, ALTO - 48, TEXTO_PARA_COMENZAR, {
				fontFamily: 'monospace',
				fontSize: '28px',
				fontStyle: 'bold',
				color: '#ffffff',
				stroke: '#000000',
				strokeThickness: 5,
			})
			.setOrigin(0.5);
		this.tweens.add({
			targets: pista,
			alpha: 0.25,
			duration: CONFIG.PORTADA.PARPADEO,
			yoyo: true,
			repeat: -1,
		});

		this.input.keyboard.on('keydown-ENTER', () => this.#comenzar());
		this.input.keyboard.on('keydown-NUMPAD_ENTER', () => this.#comenzar());
	}

	// Con ENTER la pantalla se funde a negro y empieza el nivel 1. Pulsarlo otra vez mientras se funde no hace nada.
	#comenzar() {
		if (this.comenzando) {
			return;
		}

		this.comenzando = true;
		this.cameras.main.fadeOut(CONFIG.PORTADA.FUNDIDO, 0, 0, 0);
		this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(ESCENAS.JUEGO));
	}
}
