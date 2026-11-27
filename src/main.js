import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { EscenaArranque } from './escenas/EscenaArranque.js';
import { EscenaCartel } from './escenas/EscenaCartel.js';
import { EscenaDeletreo } from './escenas/EscenaDeletreo.js';
import { EscenaHUD } from './escenas/EscenaHUD.js';
import { EscenaJuego } from './escenas/EscenaJuego.js';
import { EscenaOpciones } from './escenas/EscenaOpciones.js';

// Las herramientas de desarrollo (el modo de depuración y las pruebas de voz) solo existen con `npm run dev`: el juego
// compilado (`npm run build`, lo que se publica) no las trae ni las activa, aunque se agregue `?debug` a la dirección.
//   - `?debug` muestra los cuerpos de choque y deja el juego en la consola como `window.juego`.
//   - `?voz` y `?ingles` abren las pruebas de voz (docs/prueba-de-voz.md y docs/prueba-de-voz-ingles.md).
const esDesarrollo = import.meta.env.DEV;
const modoDebug = esDesarrollo && new URLSearchParams(window.location.search).has('debug');

async function iniciar() {
	const escenas = [
		EscenaArranque,
		EscenaJuego,
		EscenaHUD,
		EscenaDeletreo,
		EscenaOpciones,
		EscenaCartel,
	];
	if (esDesarrollo) {
		// Se cargan solo en desarrollo: en la compilación esta rama se elimina y las pruebas no entran en el paquete.
		const [{ EscenaPruebaVoz }, { EscenaPruebaIngles }] = await Promise.all([
			import('./escenas/EscenaPruebaVoz.js'),
			import('./escenas/EscenaPruebaIngles.js'),
		]);
		escenas.push(EscenaPruebaVoz, EscenaPruebaIngles);
	}

	const juego = new Phaser.Game({
		type: Phaser.AUTO,
		width: CONFIG.ANCHO,
		height: CONFIG.ALTO,
		parent: 'juego',
		backgroundColor: '#1a1612',
		// Pixel art: sin suavizado y con coordenadas enteras para que no se vea borroso.
		pixelArt: true,
		roundPixels: true,
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH,
		},
		physics: {
			default: 'arcade',
			arcade: { debug: modoDebug },
		},
		scene: escenas,
	});

	if (modoDebug) {
		window.juego = juego;
	}
}

iniciar();
