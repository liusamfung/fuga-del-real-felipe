import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { FICHAS_DE_PRUEBA } from '../datos/fichasDePrueba.js';
import { ReconocedorDeVoz } from '../sistemas/ReconocedorDeVoz.js';
import { elegirOpcion } from '../utilidades/opciones.js';

const { INGLES } = CONFIG;

// Prueba de voz en inglés. No es parte del juego: es una herramienta para medir si el navegador
// entiende a quien dice en voz alta la opción correcta de una ficha (palabra en español → su
// traducción, o definición en inglés → la palabra). Se abre con `?ingles` en la dirección
// (http://localhost:5173/?ingles) y el procedimiento está en docs/prueba-de-voz-ingles.md.
//
// Igual que en el juego, la respuesta se decide en cuanto lo oído encaja con UNA de las tres
// opciones (aunque el resultado todavía sea provisional): así se mide lo que sentiría el jugador.
// Cada intento se guarda en `window.registroDeIngles`; con la tecla C se copia como JSON para
// pasarlo. El JSON trae también el flujo crudo de lo que mandó el navegador (`eventos`).
//
// Teclas: ENTER escuchar/parar · ESPACIO otra ficha · BACKSPACE repetir · C copiar · 0 a la primera
export class EscenaPruebaIngles extends Phaser.Scene {
	constructor() {
		super(ESCENAS.PRUEBA_INGLES);
	}

	create() {
		this.numeroDeFicha = 0;
		this.registro = [];
		this.indiceAnotado = null; // dónde quedó anotado el intento actual (para no repetirlo)
		window.registroDeIngles = this.registro;
		this.estado = ReconocedorDeVoz.disponible()
			? 'Pulsa ENTER y di la opción correcta, en inglés americano, UNA sola vez'
			: 'Este navegador NO tiene reconocimiento de voz (usa Chrome)';
		this.aviso = '';
		this.escuchando = false;

		this.pantalla = this.add.text(24, 20, '', {
			fontFamily: 'monospace',
			fontSize: '15px',
			color: '#c9b79c',
			lineSpacing: 6,
			wordWrap: { width: CONFIG.ANCHO - 48 },
		});

		const teclado = this.input.keyboard;
		teclado.on('keydown-ENTER', () => this.#alternarEscucha());
		teclado.on('keydown-SPACE', () => this.#cambiarDeIntento(() => (this.numeroDeFicha += 1)));
		teclado.on('keydown-BACKSPACE', () => this.#cambiarDeIntento());
		teclado.on('keydown-C', () => this.#copiarRegistro());
		teclado.on('keydown-ZERO', () => this.#cambiarDeIntento(() => (this.numeroDeFicha = 0)));
		this.events.once('shutdown', () => this.voz.detener());

		this.#crearLaVoz();
		this.#empezarIntento();
	}

	update() {
		this.pantalla.setText(this.#texto());
	}

	get ficha() {
		return FICHAS_DE_PRUEBA[this.numeroDeFicha % FICHAS_DE_PRUEBA.length];
	}

	#crearLaVoz() {
		this.voz = new ReconocedorDeVoz({
			idioma: INGLES.IDIOMA,
			alTexto: (texto) => this.#alLlegarTexto(texto),
			alEstado: (estado) => {
				this.escuchando = estado === 'escuchando';
				if (estado === 'detenido' && this.estado.startsWith('Cerrando')) {
					this.estado = 'Parado. ESPACIO: otra ficha · BACKSPACE: repetir';
				}
			},
			alError: (codigo, grave) => {
				this.estado = `Error del micrófono: ${codigo}${grave ? ' (grave: se detuvo)' : ''}`;
				if (grave) {
					this.escuchando = false;
				}
			},
		});
	}

	// Anota el intento que se acaba y empieza otro. Primero se anota y se corta el micrófono, y recién
	// después se cambia de ficha: así el intento queda con SU ficha y nada de lo que llegue tarde se
	// cuenta en el intento nuevo.
	#cambiarDeIntento(cambiar) {
		this.#anotarElIntento();
		this.voz.detener();
		this.escuchando = false;
		cambiar?.();
		this.#empezarIntento();
		this.estado = 'Pulsa ENTER y di la opción correcta, en inglés americano, UNA sola vez';
	}

	#empezarIntento() {
		this.resultados = new Map(); // número de resultado → sus alternativas (la última versión)
		this.textosOidos = []; // lo que dijo el navegador, tal cual
		this.eventos = []; // el flujo crudo, con el tiempo de cada cosa
		this.elegida = null; // { indice, opcion, distancia, exacta, ms }
		this.sinElegir = null; // por qué todavía no se eligió: 'nada', 'ninguna' o 'ambigua'
		this.inicioDeEscucha = performance.now();
		this.indiceAnotado = null;
		this.aviso = '';
	}

	#alternarEscucha() {
		if (this.escuchando) {
			// Se pide parar, pero se esperan los últimos resultados.
			this.voz.detener({ esperarLoPendiente: true });
			this.estado = 'Cerrando… espera a que diga «Parado» antes de pasar a otra ficha';
			return;
		}

		this.inicioDeEscucha = performance.now();
		if (this.voz.iniciar()) {
			this.estado = 'Escuchando… di la opción correcta, una sola vez';
		}
	}

	#msDeEscucha() {
		return Math.round(performance.now() - this.inicioDeEscucha);
	}

	#alLlegarTexto({ numero, texto, esFinal, alternativas }) {
		this.textosOidos.push({ texto, esFinal, alternativas });
		const lista = alternativas.map((alternativa) => `«${alternativa.texto.trim()}»`).join(' ');
		this.eventos.push(
			`${this.#msDeEscucha()} ms · resultado ${numero} · ${esFinal ? 'FINAL' : 'prov'} · ${lista}`,
		);

		if (this.elegida) {
			return; // ya se eligió: lo que llegue después solo queda en los eventos
		}

		this.resultados.set(
			numero,
			alternativas.map((alternativa) => alternativa.texto),
		);
		const oido = [...this.resultados.values()].flat();
		const decision = elegirOpcion(oido, this.ficha.opciones, {
			letrasPorError: INGLES.LETRAS_POR_ERROR,
		});

		if (decision.indice < 0) {
			this.sinElegir = decision.motivo;
			return;
		}

		this.elegida = {
			indice: decision.indice,
			opcion: decision.opcion,
			distancia: decision.distancia,
			exacta: decision.exacta,
			ms: this.#msDeEscucha(),
		};
		this.eventos.push(
			`${this.elegida.ms} ms · elegida «${decision.opcion}» (a ${decision.distancia} ediciones) → ` +
				(decision.indice === this.ficha.correcta ? 'ACIERTO' : 'ERROR'),
		);
		this.voz.detener();
		this.escuchando = false;
		this.estado =
			decision.indice === this.ficha.correcta
				? '¡Correcto! ESPACIO: otra ficha · BACKSPACE: repetir'
				: `Era «${this.#correcta()}». ESPACIO: otra ficha · BACKSPACE: repetir`;
	}

	#correcta() {
		return this.ficha.opciones[this.ficha.correcta];
	}

	// Anota el intento actual (si hubo algo que anotar). Si ya estaba anotado, lo reemplaza: así
	// copiar a mitad del intento y seguir no deja el mismo intento dos veces.
	#anotarElIntento() {
		if (this.textosOidos.length === 0) {
			return;
		}

		const { ficha } = this;
		const intento = {
			ficha: this.numeroDeFicha % FICHAS_DE_PRUEBA.length,
			tipo: ficha.tipo,
			enunciado: ficha.enunciado,
			opciones: ficha.opciones,
			correcta: this.#correcta(),
			elegida: this.elegida?.opcion ?? null,
			acierto: this.elegida ? this.elegida.indice === ficha.correcta : false,
			sinElegir: this.elegida ? null : this.sinElegir,
			distanciaDeLoElegido: this.elegida?.distancia ?? null,
			msHastaLaRespuesta: this.elegida?.ms ?? null,
			oido: this.textosOidos.filter((t) => t.esFinal).map((t) => t.texto),
			eventos: this.eventos,
			idioma: INGLES.IDIOMA,
			navegador: navigator.userAgent,
		};

		if (this.indiceAnotado === null) {
			this.indiceAnotado = this.registro.length;
			this.registro.push(intento);
		} else {
			this.registro[this.indiceAnotado] = intento;
		}
		console.log('Intento anotado', intento);
	}

	async #copiarRegistro() {
		this.#anotarElIntento();
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
		const { ficha } = this;
		const tipo =
			ficha.tipo === 'traduccion'
				? 'Di la traducción al inglés:'
				: 'Di la palabra que corresponde a esta definición:';

		const opciones = ficha.opciones
			.map((opcion, indice) => {
				const marca = this.elegida
					? indice === this.elegida.indice
						? indice === ficha.correcta
							? '  ✔ la elegiste'
							: '  ✘ la elegiste'
						: indice === ficha.correcta
							? '  ← era esta'
							: ''
					: '';
				return `   ${indice + 1}) ${opcion}${marca}`;
			})
			.join('\n');

		const ultimoTexto = this.textosOidos.at(-1);
		const alternativas = ultimoTexto
			? ultimoTexto.alternativas
					.map(({ texto, confianza }) => `«${texto.trim()}» ${Math.round(confianza * 100)}%`)
					.join('  |  ')
			: '—';

		const aciertos = this.registro.filter((intento) => intento.acierto).length;
		const resumen = this.registro.length ? `   Aciertos: ${aciertos}/${this.registro.length}` : '';
		const sinElegir =
			!this.elegida && this.sinElegir
				? `Todavía no encaja con ninguna opción (${this.sinElegir})`
				: this.elegida
					? `Elegida: «${this.elegida.opcion}» (a ${this.elegida.distancia} ediciones, ${this.elegida.ms} ms)`
					: '—';

		return [
			`PRUEBA DE VOZ EN INGLÉS  ·  idioma ${INGLES.IDIOMA}  ·  ${this.escuchando ? '● ESCUCHANDO' : '○ parado'}`,
			`Ficha ${(this.numeroDeFicha % FICHAS_DE_PRUEBA.length) + 1}/${FICHAS_DE_PRUEBA.length}`,
			'',
			tipo,
			`   ${ficha.enunciado}`,
			'',
			opciones,
			'',
			`Lo que oyó el navegador: ${alternativas}`,
			sinElegir,
			'',
			this.aviso || this.estado,
			`Intentos anotados: ${this.registro.length}${resumen}`,
			'',
			'Di la opción UNA vez, con voz clara. Al terminar pulsa ENTER y espera a ver «Parado».',
			'ENTER escuchar/parar · ESPACIO otra ficha · BACKSPACE repetir · C copiar · 0 a la primera',
		].join('\n');
	}
}
