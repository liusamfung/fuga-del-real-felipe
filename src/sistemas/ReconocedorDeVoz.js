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
 *     sesgo: ['efe', 'ere', ...],   // opcional: palabras hacia las que inclinar el reconocimiento
 *                                 // (Chrome solo lo admite con procesarLocal: true)
 *     procesarLocal: false,         // opcional: reconocer en el equipo, sin mandar el audio a un servidor
 *   });
 *   voz.iniciar();   // la primera vez, el navegador pide permiso para el micrófono
 *   voz.detener();   // corta ya; con { esperarLoPendiente: true } espera los resultados que faltan
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

	/**
	 * ¿Se puede reconocer en el propio equipo (sin servidor) en este idioma? Devuelve lo que diga el
	 * navegador ('available', 'downloadable', 'downloading', 'unavailable') o 'no-soportado'.
	 */
	static async disponibilidadLocal(idioma, ventana = globalThis) {
		const Reconocimiento = ReconocedorDeVoz.#constructorDelNavegador(ventana);
		if (typeof Reconocimiento?.available !== 'function') {
			return 'no-soportado';
		}
		try {
			return await Reconocimiento.available({ langs: [idioma], processLocally: true });
		} catch {
			return 'no-soportado';
		}
	}

	/** Descarga el idioma para reconocer en el equipo. Hay que llamarlo tras un gesto del usuario. */
	static async instalarLocal(idioma, ventana = globalThis) {
		const Reconocimiento = ReconocedorDeVoz.#constructorDelNavegador(ventana);
		if (typeof Reconocimiento?.install !== 'function') {
			return false;
		}
		try {
			return Boolean(await Reconocimiento.install({ langs: [idioma], processLocally: true }));
		} catch {
			return false;
		}
	}

	constructor({
		idioma = 'es-PE',
		retenerUltima = false,
		sesgo = [],
		impulsoDelSesgo = 5,
		procesarLocal = false,
		ventana = globalThis,
		esperaDeReinicio = 150,
		alLetras,
		alTexto,
		alEstado,
		alError,
	} = {}) {
		this.idioma = idioma;
		this.sesgo = sesgo;
		this.impulsoDelSesgo = impulsoDelSesgo;
		this.procesarLocal = procesarLocal;
		this.ventana = ventana;
		this.esperaDeReinicio = esperaDeReinicio;
		this.alLetras = alLetras;
		this.alTexto = alTexto;
		this.alEstado = alEstado;
		this.alError = alError;
		this.acumulador = new AcumuladorDeVoz({ retenerUltima });
		this.activo = false;
		this.cerrando = false; // se pidió parar, pero se esperan los últimos resultados
		this.sesgoAplicado = false; // el navegador aceptó el sesgo (dato para la prueba de voz)
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

	/**
	 * Deja de escuchar. Por defecto descarta lo que quedara por llegar; con `esperarLoPendiente` el
	 * navegador termina de reconocer lo ya dicho y entrega esos resultados antes de cerrar.
	 */
	detener({ esperarLoPendiente = false } = {}) {
		this.activo = false;
		clearTimeout(this.temporizador);
		this.temporizador = null;

		const reconocimiento = this.reconocimiento;
		if (reconocimiento && esperarLoPendiente) {
			this.cerrando = true;
			reconocimiento.stop();
			return;
		}

		this.cerrando = false;
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
		if (this.procesarLocal) {
			reconocimiento.processLocally = true;
		}
		this.#aplicarElSesgo(reconocimiento);

		// Un reconocedor viejo puede mandar eventos tardíos: solo se atiende al actual.
		const esElActual = () =>
			(this.activo || this.cerrando) && reconocimiento === this.reconocimiento;

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
			if (evento.error === 'phrases-not-supported') {
				// Chrome rechaza el sesgo (pasa con el reconocimiento en el servidor): al reiniciar, sin él.
				this.sesgo = [];
			}
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
			} else {
				this.cerrando = false;
				this.reconocimiento = null;
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

	// Inclina el reconocimiento hacia los nombres de las letras (Chrome: `phrases`). Sin esto, si
	// alguien deletrea rápido, el navegador junta las letras en una palabra ("calllao"). Es opcional.
	// Chrome solo lo admite si el reconocimiento se hace en el equipo (`procesarLocal`): con el servidor
	// contesta el error `phrases-not-supported`. Si el navegador no lo tiene, se sigue sin sesgo.
	#aplicarElSesgo(reconocimiento) {
		const Frase = this.ventana.SpeechRecognitionPhrase;
		this.sesgoAplicado = false;
		if (
			this.sesgo.length === 0 ||
			!this.procesarLocal ||
			typeof Frase !== 'function' ||
			!('phrases' in reconocimiento)
		) {
			return;
		}

		try {
			reconocimiento.phrases = this.sesgo.map((texto) => new Frase(texto, this.impulsoDelSesgo));
			this.sesgoAplicado = true;
		} catch {
			// El navegador no aceptó el sesgo: se sigue sin él.
		}
	}

	#reiniciar() {
		if (this.activo) {
			this.#arrancar();
		}
	}

	#alResultado(evento) {
		// Se avisa de lo nuevo (desde resultIndex), pero las letras se sacan de TODOS los resultados
		// juntos: Chrome mueve texto de un resultado a otro (ver AcumuladorDeVoz).
		const todos = Array.from(evento.results, (resultado) => ({
			texto: resultado[0]?.transcript ?? '',
			esFinal: resultado.isFinal,
		}));

		for (let numero = evento.resultIndex; numero < evento.results.length; numero += 1) {
			const resultado = evento.results[numero];
			const alternativas = Array.from(resultado, (alternativa) => ({
				texto: alternativa.transcript,
				confianza: alternativa.confidence,
			}));
			this.alTexto?.({
				numero,
				texto: todos[numero].texto,
				esFinal: resultado.isFinal,
				alternativas,
			});
		}

		const letras = this.acumulador.procesar(todos);
		if (letras.length > 0) {
			this.alLetras?.(letras);
		}
	}
}
