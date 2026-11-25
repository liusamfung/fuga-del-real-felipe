import { AcumuladorDeVoz } from './AcumuladorDeVoz.js';

// Errores del reconocedor tras los cuales no sirve volver a intentarlo: sin permiso del micrófono,
// sin micrófono, sin conexión (Chrome manda el audio a un servidor) o idioma no admitido.
const ERRORES_GRAVES = new Set([
	'not-allowed',
	'service-not-allowed',
	'audio-capture',
	'network',
	'language-not-supported',
]);

// Errores normales que no hay que avisar: no se oyó nada, o nosotros cortamos el reconocimiento.
const ERRORES_IGNORADOS = new Set(['no-speech', 'aborted']);

/**
 * Envuelve el reconocimiento de voz del navegador (Web Speech API: `SpeechRecognition`, que en
 * Chrome se llama `webkitSpeechRecognition`) y lo traduce a letras.
 *
 *   const voz = new ReconocedorDeVoz({
 *     idioma: 'es-PE',
 *     alLetras: (letras) => ...,   // letras nuevas; cada una es una lista de candidatas
 *     alTexto: ({ numero, texto, esFinal, alternativas }) => ...,   // lo que oyó, tal cual
 *     alEstado: (estado) => ...,   // 'escuchando' | 'detenido'
 *     alError: (codigo, grave) => ...,
 *   });
 *   voz.iniciar();   // la primera vez, el navegador pide permiso para el micrófono
 *   voz.detener();
 *
 * Chrome corta el reconocimiento tras un rato de silencio: mientras esté activo se reinicia solo.
 * No funciona en Firefox. En Chrome necesita conexión a internet y una página segura (https o
 * localhost). Quien lo use debe tener siempre un plan B (el teclado): ver `disponible()` y `alError`.
 * El navegador se puede reemplazar (`ventana`) para probarlo sin micrófono.
 */
export class ReconocedorDeVoz {
	static #constructorDelNavegador(ventana) {
		return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
	}

	/** Verdadero si este navegador tiene reconocimiento de voz. */
	static disponible(ventana = globalThis) {
		return ReconocedorDeVoz.#constructorDelNavegador(ventana) !== null;
	}

	constructor({
		idioma = 'es-PE',
		retenerUltima = true,
		ventana = globalThis,
		esperaDeReinicio = 150,
		alLetras,
		alTexto,
		alEstado,
		alError,
	} = {}) {
		this.idioma = idioma;
		this.ventana = ventana;
		this.esperaDeReinicio = esperaDeReinicio;
		this.alLetras = alLetras;
		this.alTexto = alTexto;
		this.alEstado = alEstado;
		this.alError = alError;
		this.acumulador = new AcumuladorDeVoz({ retenerUltima });
		this.activo = false;
		this.reconocimiento = null;
		this.temporizador = null;
	}

	/** Empieza a escuchar. Devuelve false si el navegador no tiene reconocimiento de voz. */
	iniciar() {
		if (!ReconocedorDeVoz.disponible(this.ventana)) {
			this.alError?.('no-soportado', true);
			return false;
		}

		this.activo = true;
		return this.#arrancar();
	}

	/** Deja de escuchar y descarta lo que quedara por llegar. */
	detener() {
		this.activo = false;
		clearTimeout(this.temporizador);
		this.temporizador = null;

		const reconocimiento = this.reconocimiento;
		this.reconocimiento = null;
		if (reconocimiento) {
			reconocimiento.abort();
			this.alEstado?.('detenido');
		}
	}

	#arrancar() {
		const Reconocimiento = ReconocedorDeVoz.#constructorDelNavegador(this.ventana);
		const reconocimiento = new Reconocimiento();
		reconocimiento.lang = this.idioma;
		reconocimiento.continuous = true; // no se corta al primer silencio
		reconocimiento.interimResults = true; // da resultados mientras se habla, no solo al final
		reconocimiento.maxAlternatives = 3;

		// Un reconocedor viejo puede mandar eventos tardíos: solo se atiende al actual.
		const esElActual = () => this.activo && reconocimiento === this.reconocimiento;

		reconocimiento.onstart = () => {
			if (esElActual()) {
				this.alEstado?.('escuchando');
			}
		};
		reconocimiento.onresult = (evento) => {
			if (esElActual()) {
				this.#alResultado(evento);
			}
		};
		reconocimiento.onerror = (evento) => {
			if (reconocimiento !== this.reconocimiento || ERRORES_IGNORADOS.has(evento.error)) {
				return;
			}
			const grave = ERRORES_GRAVES.has(evento.error);
			if (grave) {
				this.activo = false;
			}
			this.alError?.(evento.error, grave);
		};
		reconocimiento.onend = () => {
			if (reconocimiento !== this.reconocimiento) {
				return;
			}
			this.alEstado?.('detenido');
			if (this.activo) {
				this.temporizador = setTimeout(() => this.#reiniciar(), this.esperaDeReinicio);
			}
		};

		this.acumulador.reiniciar(); // en cada sesión nueva los números de resultado vuelven a empezar
		this.reconocimiento = reconocimiento;
		try {
			reconocimiento.start();
			return true;
		} catch (error) {
			this.activo = false;
			this.reconocimiento = null;
			this.alError?.(error?.name ?? 'no-se-pudo-iniciar', true);
			return false;
		}
	}

	#reiniciar() {
		if (this.activo) {
			this.#arrancar();
		}
	}

	#alResultado(evento) {
		for (let numero = evento.resultIndex; numero < evento.results.length; numero += 1) {
			const resultado = evento.results[numero];
			const alternativas = Array.from(resultado, (alternativa) => ({
				texto: alternativa.transcript,
				confianza: alternativa.confidence,
			}));
			const texto = alternativas[0]?.texto ?? '';

			this.alTexto?.({ numero, texto, esFinal: resultado.isFinal, alternativas });

			const letras = this.acumulador.procesar(numero, texto, resultado.isFinal);
			if (letras.length > 0) {
				this.alLetras?.(letras);
			}
		}
	}
}
