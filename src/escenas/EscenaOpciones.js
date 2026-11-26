import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { ReconocedorDeVoz } from '../sistemas/ReconocedorDeVoz.js';
import { RetoDeOpciones } from '../sistemas/RetoDeOpciones.js';
import { NIVELES_DE_INGLES, tiempoParaLaFicha } from '../utilidades/fichas.js';

const { INGLES } = CONFIG;
const { PANEL, TIEMPO_DEL_RESULTADO } = INGLES.OPCIONES;

const COLOR = Object.freeze({
	texto: '#c9b79c',
	enunciado: '#ffffff',
	opcion: '#e8dcc6',
	acertada: '#7fd18a',
	fallada: '#e0695b',
});
const COLOR_DEL_MARCO = Object.freeze({ normal: 0xc9b79c, error: 0xc0392b, acierto: 0x7fd18a });
const COLOR_DE_LA_BARRA = Object.freeze({
	esperando: 0x6b8fb3, // todavía no corre el tiempo
	normal: 0xd9b84a,
	mitad: 0xd9894a,
	poco: 0xc0392b,
});

const TITULO = Object.freeze({
	[NIVELES_DE_INGLES.TRADUCCION]: '¡Di la traducción en inglés!',
	[NIVELES_DE_INGLES.DEFINICION]: '¡Di la palabra que corresponde!',
});

// La pantalla de los niveles 1 y 2 de los retos de inglés: se ve una ficha (una palabra en español o una
// definición en inglés) con tres opciones, y el jugador DICE la correcta en voz alta. La lanza `EscenaJuego`:
//
//   scene.launch(ESCENAS.OPCIONES, { ficha, alTerminar })
//
// `ficha` sale de `armarFicha` (src/utilidades/fichas.js): { nivel, tipo, enunciado, opciones, correcta }.
// `alTerminar(resultado)` se llama una vez, con 'acertada', 'fallada' o 'tiempo-agotado', igual que en
// `EscenaDeletreo`: al resto del juego le da lo mismo qué reto era. La pantalla se queda un momento
// mostrando el resultado (la correcta se marca siempre) y se cierra sola.
//
// El tiempo corre desde que el micrófono está escuchando, no desde que se abre la pantalla: la primera
// vez el navegador pide permiso y eso no debe gastar tiempo. La barra (azul mientras espera) mide el
// tiempo REAL (`performance.now()`), no el del juego, para que la cámara lenta no lo estire.
//
// La respuesta se decide en cuanto lo oído encaja con UNA de las tres opciones, aunque el resultado
// todavía sea provisional (así lo midió la prueba de voz en inglés). Si el micrófono falla de forma
// grave (sin permiso, sin conexión, sin soporte), la pantalla pasa sola al teclado (1, 2 o 3) y lo
// avisa: el juego nunca se queda sin forma de responder. Mientras el micrófono funciona, el teclado
// no responde: la voz es la mecánica.
export class EscenaOpciones extends Phaser.Scene {
	constructor() {
		super(ESCENAS.OPCIONES);
	}

	init({ ficha, alTerminar }) {
		this.ficha = ficha;
		this.alTerminar = alTerminar;
	}

	create() {
		const { ficha } = this;
		this.reto = new RetoDeOpciones({
			opciones: ficha.opciones,
			correcta: ficha.correcta,
			tiempoTotal: tiempoParaLaFicha(ficha, {
				base: INGLES.OPCIONES.BASE,
				porPalabra: INGLES.OPCIONES.POR_PALABRA,
			}),
			letrasPorError: INGLES.LETRAS_POR_ERROR,
		});
		this.resultadoMostrado = false;
		this.eventosYaProcesados = new WeakSet();
		this.resultadosOidos = new Map(); // número de resultado → sus alternativas (la última versión)
		this.ultimoTextoOido = '';
		this.avisoDeVoz = '';
		this.vozActiva = false; // verdadero mientras la respuesta entra por el micrófono
		this.fraccionFinal = 1;

		this.#crearPantalla();

		this.input.keyboard.on('keydown', this.#alPulsarUnaTecla, this);
		this.events.once('shutdown', () => {
			this.input.keyboard.off('keydown', this.#alPulsarUnaTecla, this);
			this.voz?.detener();
		});

		if (ReconocedorDeVoz.disponible()) {
			this.#empezarLaVoz();
		} else {
			this.#pasarAlTeclado('este navegador no tiene voz');
		}
		this.#dibujar();
	}

	update() {
		this.#revisarSiTermino();
		this.#dibujar();
	}

	/**
	 * Recibe lo que oyó el navegador (todas las alternativas de todos los resultados hasta ahora).
	 * Devuelve 'acierto', 'error' o 'ignorada'. Es la entrada de la voz.
	 */
	recibirTexto(textos) {
		const resultado = this.reto.oir(textos, performance.now());
		this.#revisarSiTermino();
		this.#dibujar();
		return resultado;
	}

	// Escuchar al micrófono. El tiempo empieza cuando el navegador avisa que ya escucha.
	#empezarLaVoz() {
		this.vozActiva = true;
		this.voz = new ReconocedorDeVoz({
			idioma: INGLES.IDIOMA,
			alTexto: ({ numero, texto, alternativas }) => {
				this.ultimoTextoOido = texto;
				this.resultadosOidos.set(
					numero,
					alternativas.map((alternativa) => alternativa.texto),
				);
				this.recibirTexto([...this.resultadosOidos.values()].flat());
			},
			alEstado: (estado) => {
				if (estado === 'escuchando') {
					this.reto.empezar(performance.now()); // solo cuenta la primera vez
				}
			},
			alError: (codigo, grave) => {
				if (grave) {
					this.#pasarAlTeclado(codigo);
				}
			},
		});
		this.voz.iniciar();
	}

	// Sin micrófono (sin permiso, sin conexión, sin soporte): se responde con las teclas 1, 2 y 3.
	#pasarAlTeclado(motivo) {
		this.vozActiva = false;
		this.voz?.detener();
		this.avisoDeVoz = `Sin micrófono (${motivo}): pulsa 1, 2 o 3`;
		this.reto.empezar(performance.now()); // si seguía esperando al micrófono, el tiempo corre ya
	}

	#alPulsarUnaTecla(evento) {
		// Con la voz activa la respuesta entra por el micrófono, no por el teclado.
		if (this.vozActiva || evento.repeat || evento.ctrlKey || evento.metaKey || evento.altKey) {
			return;
		}

		// Todas las escenas comparten una cola de eventos de teclado: el mismo evento puede llegar dos
		// veces (ver EscenaDeletreo). Una pulsación distinta es un objeto distinto.
		if (this.eventosYaProcesados.has(evento)) {
			return;
		}
		this.eventosYaProcesados.add(evento);

		const indice = Number(evento.key) - 1; // "1" → 0, "2" → 1, "3" → 2; lo demás da NaN o fuera de rango
		this.reto.elegir(indice, performance.now());
		this.#revisarSiTermino();
		this.#dibujar();
	}

	#crearPantalla() {
		const { Y, ANCHO, ALTO } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		this.graficos = this.add.graphics();
		this.titulo = this.add
			.text(centroX, Y + 26, '', { fontFamily: 'monospace', fontSize: '18px', color: COLOR.texto })
			.setOrigin(0.5);
		this.textoDelEnunciado = this.add
			.text(centroX, Y + 86, this.ficha.enunciado, {
				fontFamily: 'monospace',
				fontSize: '22px',
				color: COLOR.enunciado,
				align: 'center',
				wordWrap: { width: ANCHO - 60 },
			})
			.setOrigin(0.5);

		// Tres opciones en una fila, cada una en su tercio del panel.
		const ancho = ANCHO / this.ficha.opciones.length;
		this.opciones = this.ficha.opciones.map((opcion, posicion) =>
			this.add
				.text(
					centroX - ANCHO / 2 + ancho * (posicion + 0.5),
					Y + 148,
					`${posicion + 1}) ${opcion}`,
					{
						fontFamily: 'monospace',
						fontSize: '24px',
						fontStyle: 'bold',
						color: COLOR.opcion,
					},
				)
				.setOrigin(0.5),
		);

		this.textoDeVoz = this.add
			.text(centroX, Y + ALTO + 16, '', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: COLOR.texto,
				stroke: '#000000',
				strokeThickness: 3,
			})
			.setOrigin(0.5);
	}

	#revisarSiTermino() {
		if (this.resultadoMostrado) {
			return;
		}

		const ahora = performance.now();
		this.reto.actualizar(ahora);
		if (!this.reto.terminada) {
			return;
		}

		this.resultadoMostrado = true;
		this.voz?.detener(); // ya terminó: el micrófono se apaga
		this.fraccionFinal = this.reto.fraccionRestante(ahora);
		this.alTerminar?.(this.reto.estado);
		this.time.delayedCall(TIEMPO_DEL_RESULTADO, () => this.scene.stop());
	}

	#textoDeArriba() {
		const fijos = {
			acertada: '¡Bien!',
			fallada: '¡Te equivocaste!',
			'tiempo-agotado': '¡Se acabó el tiempo!',
		};
		if (fijos[this.reto.estado]) {
			return fijos[this.reto.estado];
		}
		return this.reto.estado === 'esperando' ? 'Conectando el micrófono…' : TITULO[this.ficha.nivel];
	}

	// La línea de abajo: qué hace el micrófono y lo último que oyó, o el aviso si falló.
	#textoDeLaVoz() {
		if (this.avisoDeVoz) {
			return this.avisoDeVoz;
		}
		if (!this.vozActiva || this.resultadoMostrado) {
			return '';
		}

		const oido = this.ultimoTextoOido ? ` · oí: «${this.ultimoTextoOido.slice(-40)}»` : '';
		return this.reto.estado === 'esperando'
			? 'Si el navegador pide permiso para el micrófono, acéptalo'
			: `Micrófono: escuchando · di la opción correcta${oido}`;
	}

	#dibujar() {
		const ahora = performance.now();
		const { reto } = this;
		const { Y, ANCHO, ALTO, ANCHO_BARRA } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		this.titulo.setText(this.#textoDeArriba());
		this.textoDeVoz.setText(this.#textoDeLaVoz());

		// Cuando termina: la elegida en verde si acertó, en rojo si falló, y la correcta siempre en verde.
		this.opciones.forEach((texto, posicion) => {
			let color = COLOR.opcion;
			if (reto.terminada) {
				if (posicion === reto.correcta) {
					color = COLOR.acertada;
				} else if (posicion === reto.elegida) {
					color = COLOR.fallada;
				}
			}
			texto.setColor(color);
		});

		const g = this.graficos;
		g.clear();

		let colorDelMarco = COLOR_DEL_MARCO.normal;
		if (reto.estado === 'acertada') {
			colorDelMarco = COLOR_DEL_MARCO.acierto;
		} else if (reto.estado === 'fallada' || reto.estado === 'tiempo-agotado') {
			colorDelMarco = COLOR_DEL_MARCO.error;
		}
		g.fillStyle(0x000000, 0.78);
		g.fillRect(centroX - ANCHO / 2, Y, ANCHO, ALTO);
		g.lineStyle(3, colorDelMarco, 1);
		g.strokeRect(centroX - ANCHO / 2, Y, ANCHO, ALTO);

		// Barra de tiempo (tiempo real).
		const fraccion = this.resultadoMostrado ? this.fraccionFinal : reto.fraccionRestante(ahora);
		let colorDeLaBarra = COLOR_DE_LA_BARRA.normal;
		if (reto.estado === 'esperando') {
			colorDeLaBarra = COLOR_DE_LA_BARRA.esperando;
		} else if (fraccion < 0.25) {
			colorDeLaBarra = COLOR_DE_LA_BARRA.poco;
		} else if (fraccion < 0.5) {
			colorDeLaBarra = COLOR_DE_LA_BARRA.mitad;
		}
		const yDeLaBarra = Y + ALTO - 34;
		g.fillStyle(0x34384a, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA, 10);
		g.fillStyle(colorDeLaBarra, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA * fraccion, 10);
	}
}
