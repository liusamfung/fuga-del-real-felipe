import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { PALABRAS } from '../datos/palabras.js';
import { Deletreo } from '../sistemas/Deletreo.js';
import { ReconocedorDeVoz } from '../sistemas/ReconocedorDeVoz.js';
import { letrasEsperadas } from '../utilidades/deletreo.js';
import { letrasDeLoDicho } from '../utilidades/voz.js';

const { VOZ } = CONFIG.DELETREO;

// Prueba de voz (el "spike" del paso 8). No es parte del juego: es una herramienta para medir qué tan
// bien reconoce el navegador a alguien deletreando en español. Se abre con `?voz` en la dirección
// (http://localhost:5173/?voz) y el procedimiento está en docs/prueba-de-voz.md.
//
// Muestra, en vivo, lo que el navegador "oye", las letras que el juego entiende de eso y cómo
// quedaría el deletreo con las mismas reglas del juego (un error no avanza la palabra).
// Cada intento se guarda en `window.registroDeVoz`; con la tecla C se copia como JSON para pasarlo.
//
// Teclas: ENTER escuchar/parar · ESPACIO otra palabra · BACKSPACE repetir · R al revés · C copiar.
export class EscenaPruebaVoz extends Phaser.Scene {
	constructor() {
		super(ESCENAS.PRUEBA_VOZ);
	}

	create() {
		this.palabras = Object.values(PALABRAS).flat();
		this.numeroDePalabra = 0;
		this.invertida = false;
		this.registro = [];
		window.registroDeVoz = this.registro;
		this.estado = ReconocedorDeVoz.disponible()
			? 'Pulsa ENTER y deletrea la palabra'
			: 'Este navegador NO tiene reconocimiento de voz (usa Chrome)';
		this.aviso = '';

		this.pantalla = this.add.text(24, 20, '', {
			fontFamily: 'monospace',
			fontSize: '15px',
			color: '#c9b79c',
			lineSpacing: 6,
			wordWrap: { width: CONFIG.ANCHO - 48 },
		});

		this.voz = new ReconocedorDeVoz({
			idioma: VOZ.IDIOMA,
			retenerUltima: VOZ.RETENER_ULTIMA,
			alLetras: (letras) => this.#alLlegarLetras(letras),
			alTexto: (texto) => this.#alLlegarTexto(texto),
			alEstado: (estado) => {
				this.escuchando = estado === 'escuchando';
			},
			alError: (codigo, grave) => {
				this.estado = `Error del micrófono: ${codigo}${grave ? ' (grave: se detuvo)' : ''}`;
				if (grave) {
					this.escuchando = false;
				}
			},
		});

		const teclado = this.input.keyboard;
		teclado.on('keydown-ENTER', () => this.#alternarEscucha());
		teclado.on('keydown-SPACE', () => this.#palabraSiguiente());
		teclado.on('keydown-BACKSPACE', () => this.#nuevoIntento());
		teclado.on('keydown-R', () => {
			this.invertida = !this.invertida;
			this.#nuevoIntento();
		});
		teclado.on('keydown-C', () => this.#copiarRegistro());
		this.events.once('shutdown', () => this.voz.detener());

		this.escuchando = false;
		this.#nuevoIntento();
	}

	update() {
		this.pantalla.setText(this.#texto());
	}

	get palabra() {
		return this.palabras[this.numeroDePalabra % this.palabras.length];
	}

	// Un intento nuevo: la misma palabra (o la siguiente) con la cuenta en cero.
	#nuevoIntento() {
		this.#guardarElIntento();
		this.deletreo = new Deletreo({
			palabra: this.palabra,
			invertida: this.invertida,
			tiempoTotal: Number.MAX_SAFE_INTEGER, // aquí no hay límite: se mide cuánto tarda
			erroresPermitidos: Number.MAX_SAFE_INTEGER,
		});
		this.deletreo.empezar(performance.now());
		this.entendidas = []; // { letra, resultado, ms }
		this.textosOidos = []; // lo que dijo el navegador, tal cual
		this.desconocidas = [];
		this.primeraLetraA = null;
		this.aviso = '';
	}

	#palabraSiguiente() {
		this.numeroDePalabra += 1;
		this.#nuevoIntento();
	}

	#alternarEscucha() {
		if (this.escuchando) {
			this.voz.detener();
			this.escuchando = false;
			this.estado = 'Parado. ESPACIO: otra palabra · BACKSPACE: repetir';
			return;
		}

		if (this.voz.iniciar()) {
			this.estado = 'Escuchando… deletrea la palabra';
		}
	}

	#alLlegarTexto({ texto, esFinal, alternativas }) {
		this.textosOidos.push({ texto, esFinal, alternativas });
		if (esFinal) {
			this.desconocidas.push(...letrasDeLoDicho(texto).desconocidas);
		}
	}

	#alLlegarLetras(letras) {
		for (const candidatas of letras) {
			const ahora = performance.now();
			this.primeraLetraA ??= ahora;
			const resultado = this.deletreo.escribir(candidatas, ahora);
			this.entendidas.push({
				letra: candidatas.join('/'),
				resultado,
				ms: Math.round(ahora - this.primeraLetraA),
			});
		}

		if (this.deletreo.estado === 'acertada') {
			this.voz.detener();
			this.escuchando = false;
			this.estado = '¡Palabra completa! ESPACIO: otra palabra';
		}
	}

	// Anota el intento que se acaba de terminar (si hubo algo que anotar).
	#guardarElIntento() {
		if (!this.deletreo || (this.entendidas.length === 0 && this.textosOidos.length === 0)) {
			return;
		}

		const esperadas = letrasEsperadas(this.palabra, this.invertida);
		const ultima = this.entendidas.at(-1);
		this.registro.push({
			palabra: this.palabra,
			alReves: this.invertida,
			esperadas: esperadas.join(' '),
			entendidas: this.entendidas
				.map(({ letra, resultado }) => (resultado === 'acierto' ? letra : `(${letra})`))
				.join(' '),
			aciertos: this.deletreo.indice,
			errores: this.deletreo.errores,
			completa: this.deletreo.estado === 'acertada',
			msHastaLaUltima: ultima?.ms ?? null,
			noEntendidas: this.desconocidas,
			oido: this.textosOidos.filter((t) => t.esFinal).map((t) => t.texto),
			idioma: VOZ.IDIOMA,
			navegador: navigator.userAgent,
		});
		console.log('Intento anotado', this.registro.at(-1));
	}

	async #copiarRegistro() {
		this.#guardarElIntento();
		const json = JSON.stringify(this.registro, null, 1);
		try {
			await navigator.clipboard.writeText(json);
			this.aviso = `Copiados ${this.registro.length} intentos al portapapeles`;
		} catch {
			console.log(json);
			this.aviso = 'No se pudo copiar: el JSON está en la consola del navegador';
		}
	}

	#texto() {
		const { deletreo } = this;
		const esperadas = letrasEsperadas(this.palabra, this.invertida);
		const hechas = esperadas.slice(0, deletreo.indice).join(' ');
		const faltan = Array(esperadas.length - deletreo.indice)
			.fill('_')
			.join(' ');

		const ultimoTexto = this.textosOidos.at(-1);
		const alternativas = ultimoTexto
			? ultimoTexto.alternativas
					.map(({ texto, confianza }) => `«${texto.trim()}» ${Math.round(confianza * 100)}%`)
					.join('  |  ')
			: '—';
		const entendidas =
			this.entendidas
				.map(({ letra, resultado }) => (resultado === 'acierto' ? letra : `(${letra})`))
				.join(' ') || '—';

		// Resumen de todos los intentos anotados.
		const total = this.registro.reduce(
			(suma, intento) => suma + intento.esperadas.split(' ').length,
			0,
		);
		const bien = this.registro.reduce((suma, intento) => suma + intento.aciertos, 0);

		return [
			`PRUEBA DE VOZ  ·  idioma ${VOZ.IDIOMA}  ·  ${this.escuchando ? '● ESCUCHANDO' : '○ parado'}`,
			'',
			`Palabra: ${this.palabra}${this.invertida ? '   (AL REVÉS)' : ''}`,
			`Hay que decir: ${esperadas.join(' ')}`,
			`Vas:           ${hechas} ${faltan}`.trimEnd(),
			`Aciertos ${deletreo.indice}/${esperadas.length}   Errores ${deletreo.errores}` +
				(this.primeraLetraA
					? `   Tiempo ${((performance.now() - this.primeraLetraA) / 1000).toFixed(1)} s`
					: ''),
			'',
			`Lo que oyó el navegador: ${alternativas}`,
			`Letras que entendí:      ${entendidas}   (entre paréntesis: error)`,
			`No son letras:           ${this.desconocidas.join(', ') || '—'}`,
			'',
			this.aviso || this.estado,
			`Intentos anotados: ${this.registro.length}` +
				(total ? `   Letras acertadas en total: ${bien}/${total}` : ''),
			'',
			'ENTER escuchar/parar · ESPACIO otra palabra · BACKSPACE repetir · R al revés · C copiar resultados',
		].join('\n');
	}
}
