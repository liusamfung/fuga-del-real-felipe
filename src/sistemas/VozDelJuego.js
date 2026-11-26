import { elegirVoz } from '../utilidades/voces.js';

// Errores normales que no hay que avisar: nosotros cortamos la voz para decir otra cosa.
const ERRORES_IGNORADOS = new Set(['interrupted', 'canceled']);

/**
 * Hace que el juego HABLE, con la voz que trae el navegador (Web Speech API: `speechSynthesis`). Es lo
 * contrario de `ReconocedorDeVoz`: aquel escucha al jugador y este le dice una palabra.
 *
 *   const voz = new VozDelJuego({ idioma: 'en-US', velocidad: 0.9 });
 *   voz.decir('window');   // false si este navegador no puede hablar
 *   voz.detener();
 *
 * Quien lo use debe tener un plan B si `VozDelJuego.disponible()` es falso (por ejemplo, mostrar la
 * palabra). Cada sistema operativo trae voces distintas: la calidad cambia de un equipo a otro.
 * Chrome solo deja hablar si el jugador ya tocó la página (una tecla o un clic), cosa que en el juego
 * ya pasó. El navegador se puede reemplazar (`ventana`) para probarlo sin altavoces.
 */
export class VozDelJuego {
	/** Verdadero si este navegador sabe hablar. */
	static disponible(ventana = globalThis) {
		return (
			typeof ventana.speechSynthesis?.speak === 'function' &&
			typeof ventana.SpeechSynthesisUtterance === 'function'
		);
	}

	constructor({ idioma = 'en-US', velocidad = 1, ventana = globalThis } = {}) {
		this.idioma = idioma;
		this.velocidad = velocidad;
		this.ventana = ventana;
	}

	/**
	 * Dice el texto, cortando lo que estuviera diciendo. Devuelve false si el navegador no puede
	 * hablar. `alTerminar` se llama al acabar de decirlo; `alError(codigo)` si no se pudo (sin voces,
	 * sin permiso…), pero no cuando nosotros mismos lo cortamos.
	 */
	decir(texto, { alTerminar, alError } = {}) {
		if (!VozDelJuego.disponible(this.ventana)) {
			return false;
		}

		const sintesis = this.ventana.speechSynthesis;
		sintesis.cancel(); // lo anterior se corta: una repetición no se encima a la primera

		const frase = new this.ventana.SpeechSynthesisUtterance(texto);
		frase.lang = this.idioma;
		frase.rate = this.velocidad;
		const voz = elegirVoz(sintesis.getVoices?.() ?? [], this.idioma);
		if (voz) {
			frase.voice = voz;
		}
		frase.onend = () => alTerminar?.();
		frase.onerror = (evento) => {
			if (!ERRORES_IGNORADOS.has(evento?.error)) {
				alError?.(evento?.error ?? 'desconocido');
			}
		};

		sintesis.speak(frase);
		return true;
	}

	/** Calla al juego si estaba hablando. */
	detener() {
		this.ventana.speechSynthesis?.cancel?.();
	}
}
