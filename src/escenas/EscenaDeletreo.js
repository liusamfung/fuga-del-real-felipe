import Phaser from 'phaser';
import { CONFIG, ESCENAS, MODOS_DE_DELETREO } from '../config.js';
import { NOMBRES_PARA_SESGAR } from '../datos/nombresDeLetras.js';
import { Deletreo } from '../sistemas/Deletreo.js';
import { ReconocedorDeVoz } from '../sistemas/ReconocedorDeVoz.js';
import {
	letrasDeLaPalabra,
	normalizarLetra,
	tiempoDeLectura,
	tiempoParaLaPalabra,
	visibilidadDeLaLetra,
} from '../utilidades/deletreo.js';

const {
	TECLADO,
	LECTURA,
	FACTOR_INVERTIDA,
	ERRORES_PERMITIDOS,
	TIEMPO_DEL_RESULTADO,
	DESTELLO_DE_ERROR,
	PANEL,
	VOZ,
} = CONFIG.DELETREO;

const COLOR_DE_LETRA = Object.freeze({
	pendiente: '#c9b79c',
	siguiente: '#ffffff',
	acertada: '#7fd18a',
	fallada: '#e0695b',
});
const COLOR_DEL_MARCO = Object.freeze({ normal: 0xc9b79c, error: 0xc0392b, acierto: 0x7fd18a });
const COLOR_DE_LA_BARRA = Object.freeze({
	leyendo: 0x6b8fb3, // todavía no corre el tiempo
	normal: 0xd9b84a,
	mitad: 0xd9894a,
	poco: 0xc0392b,
});

// La pantalla del deletreo: se dibuja encima del juego y muestra la palabra, las letras que van bien
// y una barra con el tiempo que queda. La lanza `EscenaJuego`:
//
//   scene.launch(ESCENAS.DELETREO, { palabra, invertida, modo, usaVoz, alTerminar })
//
// `usaVoz`: las letras se dicen al micrófono en vez de teclearse, con el doble de tiempo. Si el
// navegador no tiene reconocimiento de voz o el micrófono falla (sin permiso, sin conexión), la pantalla
// pasa sola al teclado y lo avisa: el juego nunca se queda sin forma de deletrear.
//
// `modo` es uno de `MODOS_DE_DELETREO`. En 'visible' la palabra se ve siempre. En 'huecos' y 'memoria'
// se enseña una sola vez, el tiempo justo para leerla (la barra, azul, todavía no corre), y después
// se esconde y empieza la cuenta regresiva: en 'huecos' quedan los espacios, como en el Ahorcado
// (las letras acertadas van apareciendo); en 'memoria' no queda nada.
//
// `alTerminar(resultado)` se llama una vez, con 'acertada', 'fallada' o 'tiempo-agotado'. La pantalla
// se queda un momento mostrando el resultado y se cierra sola.
//
// La barra mide el tiempo REAL (`performance.now()`), no el del juego: cuando el mundo vaya en cámara
// lenta (el ataque fuerte del jefe), el tiempo del jugador no se estira.
//
// Las letras entran por `recibirLetra`, las mande el teclado o la voz: las mismas reglas para las dos.
export class EscenaDeletreo extends Phaser.Scene {
	constructor() {
		super(ESCENAS.DELETREO);
	}

	init({
		palabra,
		invertida = false,
		modo = MODOS_DE_DELETREO.VISIBLE,
		usaVoz = false,
		alTerminar,
	}) {
		this.palabra = palabra;
		this.invertida = invertida;
		this.modo = modo;
		this.usaVoz = usaVoz;
		this.alTerminar = alTerminar;
	}

	create() {
		const cantidadDeLetras = letrasDeLaPalabra(this.palabra).length;
		// Sin reconocimiento de voz en el navegador se usa el teclado, con el tiempo del teclado.
		const conVoz = this.usaVoz && ReconocedorDeVoz.disponible();
		this.deletreo = new Deletreo({
			palabra: this.palabra,
			invertida: this.invertida,
			tiempoTotal: tiempoParaLaPalabra(
				cantidadDeLetras,
				{
					base: TECLADO.BASE,
					porLetra: TECLADO.POR_LETRA,
					factorInvertida: FACTOR_INVERTIDA,
					factor: conVoz ? VOZ.FACTOR_DE_TIEMPO : 1,
				},
				this.invertida,
			),
			lectura:
				this.modo === MODOS_DE_DELETREO.VISIBLE
					? 0
					: tiempoDeLectura(cantidadDeLetras, { base: LECTURA.BASE, porLetra: LECTURA.POR_LETRA }),
			erroresPermitidos: ERRORES_PERMITIDOS,
		});
		this.resultadoMostrado = false;
		this.eventosYaProcesados = new WeakSet();
		this.errorHasta = 0; // hasta cuándo el marco se ve rojo por un error
		this.fraccionFinal = 1; // lo que quedaba de tiempo cuando terminó
		this.vozActiva = false; // verdadero mientras las letras entran por el micrófono
		this.estadoDeLaVoz = '';
		this.ultimoTextoOido = '';
		this.avisoDeVoz = '';

		this.#crearPantalla();

		this.input.keyboard.on('keydown', this.#alPulsarUnaTecla, this);
		this.events.once('shutdown', () => {
			this.input.keyboard.off('keydown', this.#alPulsarUnaTecla, this);
			this.voz?.detener();
		});

		this.deletreo.empezar(performance.now());
		if (this.usaVoz) {
			this.#empezarLaVoz();
		}
		this.#dibujar();
	}

	update() {
		this.#revisarSiTermino();
		this.#dibujar();
	}

	/**
	 * Recibe una letra (o una lista de letras candidatas, para la voz). Es la entrada del deletreo:
	 * la usan el teclado y la voz. Devuelve 'acierto', 'error' o 'ignorada'.
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

	// Escuchar al micrófono. Las letras que reconoce entran por `recibirLetra`. Si falla de forma grave
	// (sin permiso, sin conexión, sin soporte) se pasa al teclado.
	#empezarLaVoz() {
		this.vozActiva = true;
		this.estadoDeLaVoz = 'conectando';
		this.voz = new ReconocedorDeVoz({
			idioma: VOZ.IDIOMA,
			retenerUltima: VOZ.RETENER_ULTIMA,
			sesgo: VOZ.SESGAR_A_LAS_LETRAS ? NOMBRES_PARA_SESGAR : [],
			impulsoDelSesgo: VOZ.IMPULSO_DEL_SESGO,
			procesarLocal: VOZ.PROCESAR_EN_EL_EQUIPO,
			alLetras: (letras) => letras.forEach((candidatas) => this.recibirLetra(candidatas)),
			alTexto: ({ texto }) => {
				this.ultimoTextoOido = texto;
			},
			alEstado: (estado) => {
				this.estadoDeLaVoz = estado;
			},
			alError: (codigo, grave) => {
				if (grave) {
					this.#pasarAlTeclado(codigo);
				}
			},
		});
		this.voz.iniciar();
	}

	#pasarAlTeclado(motivo) {
		if (!this.vozActiva) {
			return;
		}
		this.vozActiva = false;
		this.voz?.detener();
		this.avisoDeVoz = `Sin micrófono (${motivo}): ¡usa el teclado!`;
	}

	#alPulsarUnaTecla(evento) {
		// Con la voz activa las letras entran por el micrófono, no por el teclado.
		if (this.vozActiva) {
			return;
		}

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
		const { Y, ALTO, SEPARACION_LETRAS } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		this.graficos = this.add.graphics();
		this.textoDeVoz = this.add
			.text(centroX, Y + ALTO / 2 + 22, '', {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: '#c9b79c',
				stroke: '#000000',
				strokeThickness: 3,
			})
			.setOrigin(0.5);
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
			caracter,
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
		this.voz?.detener(); // ya terminó: el micrófono se apaga
		this.fraccionFinal = this.deletreo.fraccionRestante(ahora);
		this.alTerminar?.(this.deletreo.estado);
		this.time.delayedCall(TIEMPO_DEL_RESULTADO, () => this.scene.stop());
	}

	// La línea de abajo: qué hace el micrófono y lo último que oyó, o el aviso si falló.
	#textoDeLaVoz() {
		if (this.avisoDeVoz) {
			return this.avisoDeVoz;
		}
		if (!this.vozActiva || this.resultadoMostrado) {
			return '';
		}

		const estado = this.estadoDeLaVoz === 'escuchando' ? 'escuchando' : 'conectando…';
		const oido = this.ultimoTextoOido ? ` · oí: «${this.ultimoTextoOido.slice(-40)}»` : '';
		return `Micrófono: ${estado} · di cada letra con una pausa${oido}`;
	}

	#textoDeArriba() {
		const { estado } = this.deletreo;
		const fijos = {
			mostrando: '¡Memoriza la palabra!',
			acertada: '¡Bien!',
			fallada: '¡Te equivocaste!',
			'tiempo-agotado': '¡Se acabó el tiempo!',
		};
		if (fijos[estado]) {
			return fijos[estado];
		}

		if (this.modo === MODOS_DE_DELETREO.MEMORIA) {
			return this.invertida ? '¡De memoria y AL REVÉS!' : '¡Deletrea de memoria!';
		}
		return this.invertida ? '¡Deletrea AL REVÉS!' : '¡Deletrea la palabra!';
	}

	#dibujar() {
		const ahora = performance.now();
		const { deletreo } = this;
		const { Y, ANCHO, ALTO, ANCHO_BARRA, SEPARACION_LETRAS } = PANEL;
		const centroX = CONFIG.ANCHO / 2;

		this.titulo.setText(this.#textoDeArriba());
		this.textoDeVoz.setText(this.#textoDeLaVoz());

		// Letras: verdes las que van bien, la que toca en blanco, las demás en tono tierra. Según el
		// modo, pueden estar escondidas: se cambian por un hueco o por nada.
		for (const { texto, caracter, orden } of this.letras) {
			const visibilidad = visibilidadDeLaLetra({
				modo: this.modo,
				estado: deletreo.estado,
				orden,
				indice: deletreo.indice,
			});
			texto.setVisible(visibilidad !== 'nada');
			texto.setText(visibilidad === 'hueco' ? '_' : caracter);

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

		// Una rayita bajo la letra que toca. Solo en el modo visible: en los otros, saber cuál toca
		// es parte del reto.
		const siguiente = this.letras.find(({ orden }) => orden === deletreo.indice);
		if (this.modo === MODOS_DE_DELETREO.VISIBLE && siguiente && !deletreo.terminada) {
			g.fillStyle(0xffffff, 1);
			g.fillRect(siguiente.texto.x - SEPARACION_LETRAS / 2 + 4, Y + 24, SEPARACION_LETRAS - 8, 3);
		}

		// Barra de tiempo (tiempo real).
		const fraccion = this.resultadoMostrado ? this.fraccionFinal : deletreo.fraccionRestante(ahora);
		let colorDeLaBarra = COLOR_DE_LA_BARRA.normal;
		if (deletreo.estado === 'mostrando') {
			colorDeLaBarra = COLOR_DE_LA_BARRA.leyendo;
		} else if (fraccion < 0.25) {
			colorDeLaBarra = COLOR_DE_LA_BARRA.poco;
		} else if (fraccion < 0.5) {
			colorDeLaBarra = COLOR_DE_LA_BARRA.mitad;
		}
		const yDeLaBarra = Y + 46;
		g.fillStyle(0x34384a, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA, 10);
		g.fillStyle(colorDeLaBarra, 1);
		g.fillRect(centroX - ANCHO_BARRA / 2, yDeLaBarra, ANCHO_BARRA * fraccion, 10);
	}
}
