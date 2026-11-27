import { CONFIG } from '../config.js';
import { AUDIOS } from '../datos/audio.js';
import {
	acercarElVolumen,
	puedeSonar,
	ritmoDeLaMusica,
	variacionDeTono,
} from '../utilidades/sonido.js';

// Reproduce los efectos y la música del juego (catálogo en src/datos/audio.js). La escena del juego crea uno y lo deja
// en `escena.sonido`; el resto del código lo usa con `escena.sonido?.efecto('jugador-disparo')`.
//
//   efecto(clave)      suena una vez; si ese mismo efecto sonó hace menos de su `separacion`, no suena, y cada vez cambia un
//                      poco de tono
//   musica(clave)      empieza la música en bucle (y para la anterior); pedir la que ya suena no la reinicia
//   alternarSilencio() silencia o devuelve todo el sonido y lo recuerda para la próxima vez
//   atenuar(activa)    baja el volumen de la música y los efectos a una fracción (para oír bien la palabra del dictado) o lo
//                      devuelve; `actualizar()` lo mueve con suavidad y se llama en cada fotograma
//
// Los navegadores no dejan sonar nada hasta que el jugador toca el teclado o el ratón: Phaser guarda lo que se pide antes
// y lo reproduce en cuanto se desbloquea, así la música arranca con la primera tecla.
export class Sonido {
	constructor(escena) {
		this.escena = escena;
		this.ultimaVez = new Map(); // clave → instante (ms reales) en que sonó por última vez
		this.musicaActual = null;
		this.claveDeLaMusica = null;
		this.ritmoActual = 1;
		this.factor = 1; // qué fracción del volumen suena ahora (1 = todo); cambia con suavidad hacia `factorObjetivo`
		this.factorObjetivo = 1;
		this.ultimoAjuste = performance.now();

		this.escena.sound.mute = Sonido.#leerElSilencioGuardado();
	}

	/** Suena el efecto `clave`. Devuelve verdadero si sonó (falso si se ignoró por sonar demasiado seguido). */
	efecto(clave, { volumen = 1 } = {}) {
		const datos = AUDIOS[clave];
		if (!datos || datos.tipo !== 'efecto') {
			console.warn(`[sonido] «${clave}» no es un efecto del catálogo`);
			return false;
		}

		// Se mide en tiempo real: en cámara lenta el reloj de la escena va más despacio y no serviría.
		const ahora = performance.now();
		if (!puedeSonar(this.ultimaVez.get(clave), ahora, datos.separacion)) {
			return false;
		}
		this.ultimaVez.set(clave, ahora);

		this.escena.sound.play(clave, {
			volume: datos.volumen * volumen * this.factor,
			detune: variacionDeTono(Math.random, datos.variacion),
		});
		return true;
	}

	/** Pone la música `clave` en bucle. Si ya suena esa, la deja. Una clave que no existe se ignora (con un aviso). */
	musica(clave) {
		if (clave === this.claveDeLaMusica && this.musicaActual) {
			return;
		}

		this.detenerMusica();
		const datos = AUDIOS[clave];
		if (!datos || datos.tipo !== 'musica') {
			console.warn(`[sonido] «${clave}» no es una música del catálogo`);
			return;
		}

		this.musicaActual = this.escena.sound.add(clave, {
			loop: true,
			volume: datos.volumen * this.factor,
		});
		this.claveDeLaMusica = clave;
		this.ritmoActual = 1;
		this.musicaActual.play();
	}

	/** Para la música (y la libera). */
	detenerMusica() {
		this.musicaActual?.stop();
		this.musicaActual?.destroy();
		this.musicaActual = null;
		this.claveDeLaMusica = null;
	}

	/**
	 * Ajusta la velocidad de la música a la del mundo (`escala`: 1 normal, `factor` en plena cámara lenta): baja de tono
	 * y de ritmo como una cinta que se frena. Se llama en cada fotograma; solo toca el audio si el ritmo cambió.
	 */
	ajustarLaMusicaALaEscalaDelTiempo(escala, factor) {
		if (!this.musicaActual) {
			return;
		}

		const ritmo = ritmoDeLaMusica(escala, { factor, minimo: CONFIG.AUDIO.MUSICA_EN_CAMARA_LENTA });
		if (Math.abs(ritmo - this.ritmoActual) > 0.01) {
			this.musicaActual.setRate(ritmo);
			this.ritmoActual = ritmo;
		}
	}

	/**
	 * Pide bajar (`true`) o devolver (`false`) el volumen de todo lo que suena por el juego, para que se oiga bien la palabra
	 * que dice la voz del navegador en el dictado. La voz del navegador no se toca: es otro sonido.
	 */
	atenuar(activa) {
		this.factorObjetivo = activa ? CONFIG.AUDIO.VOLUMEN_EN_EL_DICTADO : 1;
	}

	/** Mueve el volumen hacia el pedido con `atenuar`. Se llama en cada fotograma; solo toca el audio si cambió. */
	actualizar() {
		const ahora = performance.now();
		const dt = Math.min(100, ahora - this.ultimoAjuste); // tiempo real (en cámara lenta el reloj del juego no sirve)
		this.ultimoAjuste = ahora;
		if (this.factor === this.factorObjetivo) {
			return;
		}

		this.factor = acercarElVolumen(
			this.factor,
			this.factorObjetivo,
			dt,
			CONFIG.AUDIO.TRANSICION_DEL_VOLUMEN,
		);
		if (this.musicaActual) {
			this.musicaActual.setVolume(AUDIOS[this.claveDeLaMusica].volumen * this.factor);
		}
	}

	/** Silencia todo el sonido si estaba sonando, o lo devuelve. Devuelve verdadero si quedó SILENCIADO. */
	alternarSilencio() {
		const silenciado = !this.escena.sound.mute;
		this.escena.sound.mute = silenciado;
		try {
			window.localStorage.setItem(CONFIG.AUDIO.CLAVE_DEL_SILENCIO, silenciado ? '1' : '0');
		} catch {
			// Sin almacenamiento (ventana privada, datos bloqueados): el silencio vale solo para esta partida.
		}
		return silenciado;
	}

	static #leerElSilencioGuardado() {
		try {
			return window.localStorage.getItem(CONFIG.AUDIO.CLAVE_DEL_SILENCIO) === '1';
		} catch {
			return false;
		}
	}
}
