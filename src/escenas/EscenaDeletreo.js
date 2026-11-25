import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { Deletreo } from '../sistemas/Deletreo.js';
import { letrasDeLaPalabra, normalizarLetra, tiempoParaLaPalabra } from '../utilidades/deletreo.js';

const {
	TECLADO,
	FACTOR_INVERTIDA,
	ERRORES_PERMITIDOS,
	TIEMPO_DEL_RESULTADO,
	DESTELLO_DE_ERROR,
	PANEL,
} = CONFIG.DELETREO;

const COLOR_DE_LETRA = Object.freeze({
	pendiente: '#c9b79c',
	siguiente: '#ffffff',
	acertada: '#7fd18a',
	fallada: '#e0695b',
});
const COLOR_DEL_MARCO = Object.freeze({ normal: 0xc9b79c, error: 0xc0392b, acierto: 0x7fd18a });

// La pantalla del deletreo: se dibuja encima del juego y muestra la palabra, las letras que van bien
// y una barra con el tiempo que queda. La lanza `EscenaJuego`:
//
//   scene.launch(ESCENAS.DELETREO, { palabra, invertida, alTerminar })
//
// `alTerminar(resultado)` se llama una vez, con 'acertada', 'fallada' o 'tiempo-agotado'. La pantalla
// se queda un momento mostrando el resultado y se cierra sola.
//
// La barra mide el tiempo REAL (`performance.now()`), no el del juego: cuando el mundo vaya en cámara
// lenta (el ataque fuerte del jefe), el tiempo del jugador no se estira.
//
// Las letras entran por `recibirLetra`. Hoy las manda el teclado; el modo de voz usará el mismo método.
export class EscenaDeletreo extends Phaser.Scene {
	constructor() {
		super(ESCENAS.DELETREO);
	}

	init({ palabra, invertida = false, alTerminar }) {
		this.palabra = palabra;
		this.invertida = invertida;
		this.alTerminar = alTerminar;
	}

	create() {
		const cantidadDeLetras = letrasDeLaPalabra(this.palabra).length;
		this.deletreo = new Deletreo({
			palabra: this.palabra,
			invertida: this.invertida,
			tiempoTotal: tiempoParaLaPalabra(
				cantidadDeLetras,
				{ base: TECLADO.BASE, porLetra: TECLADO.POR_LETRA, factorInvertida: FACTOR_INVERTIDA },
				this.invertida,
			),
			erroresPermitidos: ERRORES_PERMITIDOS,
		});
		this.resultadoMostrado = false;
		this.eventosYaProcesados = new WeakSet();
		this.errorHasta = 0; // hasta cuándo el marco se ve rojo por un error
		this.fraccionFinal = 1; // lo que quedaba de tiempo cuando terminó

		this.#crearPantalla();

		this.input.keyboard.on('keydown', this.#alPulsarUnaTecla, this);
		this.events.once('shutdown', () => {
			this.input.keyboard.off('keydown', this.#alPulsarUnaTecla, this);
		});

		this.deletreo.empezar(performance.now());
		this.#dibujar();
	}

	update() {
		this.#revisarSiTermino();
		this.#dibujar();
	}

	/**
	 * Recibe una letra. Es la entrada del deletreo: la usa el teclado y la usará la voz.
	 * Devuelve 'acierto', 'error' o 'ignorada'.
	 */
	recibirLetra(caracter) {
		const ahora = performance.now();
		const resultado = this.deletreo.escribir(caracter, ahora);
		if (resultado === 'error') {
			this.errorHasta = ahora + DESTELLO_DE_ERROR;
		}
		this.#revisarSiTermino();
		this.#dibujar();
		return resultado;
	}

	#alPulsarUnaTecla(evento) {
		// Mantener una tecla pulsada repite el evento: cada letra necesita una pulsación nueva.
		if (evento.repeat || evento.ctrlKey || evento.metaKey || evento.altKey) {
			return;
		}

		// Todas las escenas comparten una cola de eventos de teclado y Phaser la recorre entera en cada
		// fotograma. Si caen varias teclas en el mismo fotograma, el mismo evento puede llegar dos veces
		// y una letra contaría doble (o un error falso). Una pulsación distinta es un objeto distinto.
		if (this.eventosYaProcesados.has(evento)) {
			return;
		}
		this.eventosYaProcesados.add(evento);

		this.recibirLetra(evento.key);
	}

	#crearPantalla() {
		const { Y, SEPARACION_LETRAS } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		this.graficos = this.add.graphics();
		this.titulo = this.add
			.text(centroX, Y - 48, '', { fontFamily: 'monospace', fontSize: '18px', color: '#c9b79c' })
			.setOrigin(0.5);

		// Una letra suelta por cada letra de la palabra. Se guarda en qué lugar de la lista de letras
		// que hay que escribir está cada una: al revés, la primera letra de la palabra se escribe al final.
		const mostradas = [...this.palabra].filter((caracter) => normalizarLetra(caracter) !== null);
		const inicioX = centroX - ((mostradas.length - 1) * SEPARACION_LETRAS) / 2;
		this.letras = mostradas.map((caracter, posicion) => ({
			texto: this.add
				.text(inicioX + posicion * SEPARACION_LETRAS, Y, caracter, {
					fontFamily: 'monospace',
					fontSize: '36px',
					fontStyle: 'bold',
					color: COLOR_DE_LETRA.pendiente,
				})
				.setOrigin(0.5),
			orden: this.invertida ? mostradas.length - 1 - posicion : posicion,
		}));
	}

	#revisarSiTermino() {
		if (this.resultadoMostrado) {
			return;
		}

		const ahora = performance.now();
		this.deletreo.actualizar(ahora);
		if (!this.deletreo.terminada) {
			return;
		}

		this.resultadoMostrado = true;
		this.fraccionFinal = this.deletreo.fraccionRestante(ahora);
		this.alTerminar?.(this.deletreo.estado);
		this.time.delayedCall(TIEMPO_DEL_RESULTADO, () => this.scene.stop());
	}

	#dibujar() {
		const ahora = performance.now();
		const { deletreo } = this;
		const { Y, ANCHO, ALTO, ANCHO_BARRA, SEPARACION_LETRAS } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		// Texto de arriba
		const textos = {
			acertada: '¡Bien!',
			fallada: '¡Te equivocaste!',
			'tiempo-agotado': '¡Se acabó el tiempo!',
		};
		this.titulo.setText(
			textos[deletreo.estado] ?? (this.invertida ? '¡Deletrea AL REVÉS!' : '¡Deletrea la palabra!'),
		);

		// Letras: verdes las que van bien, la que toca en blanco, las demás en tono tierra.
		for (const { texto, orden } of this.letras) {
			let color = COLOR_DE_LETRA.pendiente;
			if (orden < deletreo.indice) {
				color = COLOR_DE_LETRA.acertada;
			} else if (orden === deletreo.indice && !deletreo.terminada) {
				color = COLOR_DE_LETRA.siguiente;
			} else if (deletreo.estado === 'fallada' || deletreo.estado === 'tiempo-agotado') {
				color = COLOR_DE_LETRA.fallada;
			}
			texto.setColor(color);
		}

		const g = this.graficos;
		g.clear();

		// Marco: rojo un instante al equivocarse, verde al acertar.
		let colorDelMarco = COLOR_DEL_MARCO.normal;
		if (deletreo.estado === 'acertada') {
			colorDelMarco = COLOR_DEL_MARCO.acierto;
		} else if (
			ahora < this.errorHasta ||
			deletreo.estado === 'fallada' ||
			deletreo.estado === 'tiempo-agotado'
		) {
			colorDelMarco = COLOR_DEL_MARCO.error;
		}
		g.fillStyle(0x000000, 0.78);
		g.fillRect(centroX - ANCHO / 2, Y - ALTO / 2 - 10, ANCHO, ALTO);
		g.lineStyle(3, colorDelMarco, 1);
		g.strokeRect(centroX - ANCHO / 2, Y - ALTO / 2 - 10, ANCHO, ALTO);

		// Una rayita bajo la letra que toca.
		const siguiente = this.letras.find(({ orden }) => orden === deletreo.indice);
		if (siguiente && !deletreo.terminada) {
			g.fillStyle(0xffffff, 1);
			g.fillRect(siguiente.texto.x - SEPARACION_LETRAS / 2 + 4, Y + 24, SEPARACION_LETRAS - 8, 3);
		}

		// Barra de tiempo (tiempo real).
		const fraccion = this.resultadoMostrado ? this.fraccionFinal : deletreo.fraccionRestante(ahora);
		let colorDeLaBarra = 0xd9b84a;
		if (fraccion < 0.25) {
			colorDeLaBarra = 0xc0392b;
		} else if (fraccion < 0.5) {
			colorDeLaBarra = 0xd9894a;
		}
		const yDeLaBarra = Y + 46;
		g.fillStyle(0x34384a, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA, 10);
		g.fillStyle(colorDeLaBarra, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA * fraccion, 10);
	}
}
