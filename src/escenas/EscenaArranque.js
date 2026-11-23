import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';

// Primera escena del juego. Por ahora solo muestra el título;
// más adelante cargará los recursos y pasará al menú.
export class EscenaArranque extends Phaser.Scene {
	constructor() {
		super(ESCENAS.ARRANQUE);
	}

	create() {
		const centroX = CONFIG.ANCHO / 2;
		const centroY = CONFIG.ALTO / 2;

		this.add
			.text(centroX, centroY - 12, 'Fuga del Real Felipe', {
				fontFamily: 'monospace',
				fontSize: '24px',
				color: '#c9b79c',
			})
			.setOrigin(0.5);

		this.add
			.text(centroX, centroY + 16, 'Sitio del Callao, 1824–1826', {
				fontFamily: 'monospace',
				fontSize: '12px',
				color: '#7f8c8d',
			})
			.setOrigin(0.5);
	}
}
