import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { NOMBRES_PARA_SESGAR } from '../datos/nombresDeLetras.js';
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
// El JSON trae, además, el flujo crudo de lo que mandó el navegador (`eventos`), para poder
// reproducirlo después con otras reglas sin volver a hablar.
//
// Teclas: ENTER escuchar/parar · ESPACIO otra palabra · BACKSPACE repetir · R al revés · C copiar
//         P sesgar hacia las letras · L reconocer en el equipo
export class EscenaPruebaVoz extends Phaser.Scene {
	constructor() {
		super(ESCENAS.PRUEBA_VOZ);
	}

	create() {
		this.palabras = Object.values(PALABRAS).flat();
		this.numeroDePalabra = 0;
		this.invertida = false;
		this.sesgar = false;
		this.local = false;
		this.registro = [];
		this.indiceAnotado = null; // dónde quedó anotado el intento actual (para no repetirlo)
		window.registroDeVoz = this.registro;
		this.estado = ReconocedorDeVoz.disponible()
			? 'Pulsa ENTER y deletrea la palabra, letra por letra'
			: 'Este navegador NO tiene reconocimiento de voz (usa Chrome)';
		this.aviso = '';

		this.pantalla = this.add.text(24, 20, '', {
			fontFamily: 'monospace',
			fontSize: '15px',
			color: '#c9b79c',
			lineSpacing: 6,
			wordWrap: { width: CONFIG.ANCHO - 48 },
		});

		const teclado = this.input.keyboard;
		teclado.on('keydown-ENTER', () => this.#alternarEscucha());
		teclado.on('keydown-SPACE', () => this.#cambiarDeIntento(() => (this.numeroDePalabra += 1)));
		teclado.on('keydown-BACKSPACE', () => this.#cambiarDeIntento());
		teclado.on('keydown-R', () => this.#cambiarDeIntento(() => (this.invertida = !this.invertida)));
		teclado.on('keydown-C', () => this.#copiarRegistro());
		teclado.on('keydown-P', () => this.#alternarElSesgo());
		teclado.on('keydown-L', () => this.#alternarLocal());
		this.events.once('shutdown', () => this.voz.detener());

		this.escuchando = false;
		this.#crearLaVoz();
		this.#empezarIntento();
	}

	update() {
		this.pantalla.setText(this.#texto());
	}

	get palabra() {
		return this.palabras[this.numeroDePalabra % this.palabras.length];
	}

	// El reconocedor se crea de nuevo cada vez que cambia una opción (sesgo, en el equipo).
	#crearLaVoz() {
		this.voz?.detener();
		this.escuchando = false;
		this.voz = new ReconocedorDeVoz({
			idioma: VOZ.IDIOMA,
			retenerUltima: VOZ.RETENER_ULTIMA,
			sesgo: this.sesgar ? NOMBRES_PARA_SESGAR : [],
			impulsoDelSesgo: VOZ.IMPULSO_DEL_SESGO,
			procesarLocal: this.local,
			alLetras: (letras) => this.#alLlegarLetras(letras),
			alTexto: (texto) => this.#alLlegarTexto(texto),
			alEstado: (estado) => {
				this.escuchando = estado === 'escuchando';
				if (estado === 'detenido' && this.estado.startsWith('Cerrando')) {
					this.estado = 'Parado. ESPACIO: otra palabra · BACKSPACE: repetir';
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
	// después se cambia la palabra: así el intento queda con SU palabra y nada de lo que llegue tarde
	// se cuenta en el intento nuevo.
	#cambiarDeIntento(cambiar) {
		this.#anotarElIntento();
		this.voz.detener();
		this.escuchando = false;
		cambiar?.();
		this.#empezarIntento();
		this.estado = 'Pulsa ENTER y deletrea la palabra, letra por letra';
	}

	#empezarIntento() {
		this.deletreo = new Deletreo({
			palabra: this.palabra,
			invertida: this.invertida,
			tiempoTotal: Number.MAX_SAFE_INTEGER, // aquí no hay límite: se mide cuánto tarda
			erroresPermitidos: Number.MAX_SAFE_INTEGER,
		});
		this.deletreo.empezar(performance.now());
		this.entendidas = []; // { letra, resultado, ms }
		this.textosOidos = []; // lo que dijo el navegador, tal cual
		this.eventos = []; // el flujo crudo, con el tiempo de cada cosa
		this.desconocidas = [];
		this.primeraLetraA = null;
		this.inicioDeEscucha = performance.now();
		this.indiceAnotado = null;
		this.aviso = '';
	}

	#alternarEscucha() {
		if (this.escuchando) {
			// Se pide parar, pero se esperan los últimos resultados: la última letra llega al final.
			this.voz.detener({ esperarLoPendiente: true });
			this.estado = 'Cerrando… espera a que diga «Parado» antes de pasar a otra palabra';
			return;
		}

		this.inicioDeEscucha = performance.now();
		if (this.voz.iniciar()) {
			this.estado = 'Escuchando… deletrea la palabra, una letra a la vez';
		}
	}

	#alternarElSesgo() {
		this.sesgar = !this.sesgar;
		this.#crearLaVoz();
		this.aviso = this.sesgar
			? this.local
				? 'Sesgo hacia los nombres de las letras: ACTIVADO (ENTER para probar)'
				: 'Sesgo pedido, pero Chrome solo lo admite con L (reconocer en el equipo)'
			: 'Sesgo hacia los nombres de las letras: apagado';
	}

	async #alternarLocal() {
		if (this.local) {
			this.local = false;
			this.#crearLaVoz();
			this.aviso = 'Reconocimiento en el servidor de Google (lo normal)';
			return;
		}

		this.aviso = 'Mirando si se puede reconocer en el equipo…';
		let disponibilidad = await ReconocedorDeVoz.disponibilidadLocal(VOZ.IDIOMA);
		if (disponibilidad === 'downloadable') {
			this.aviso = 'Descargando el idioma para reconocer en el equipo…';
			disponibilidad = (await ReconocedorDeVoz.instalarLocal(VOZ.IDIOMA))
				? 'available'
				: 'no-se-pudo-descargar';
		}

		if (disponibilidad === 'available') {
			this.local = true;
			this.#crearLaVoz();
			this.aviso = 'Reconociendo EN EL EQUIPO, sin servidor (ENTER para probar)';
		} else {
			this.aviso = `No se puede reconocer en el equipo (${disponibilidad}). Sigue en el servidor.`;
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
			this.eventos.push(`${this.#msDeEscucha()} ms · letra ${candidatas.join('/')} → ${resultado}`);
		}

		if (this.deletreo.estado === 'acertada') {
			this.voz.detener();
			this.escuchando = false;
			this.estado = '¡Palabra completa! ESPACIO: otra palabra';
		}
	}

	// Anota el intento actual (si hubo algo que anotar). Si ya estaba anotado, lo reemplaza: así
	// copiar a mitad del intento y seguir no deja el mismo intento dos veces.
	#anotarElIntento() {
		if (this.entendidas.length === 0 && this.textosOidos.length === 0) {
			return;
		}

		const esperadas = letrasEsperadas(this.palabra, this.invertida);
		const ultima = this.entendidas.at(-1);
		const intento = {
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
			eventos: this.eventos,
			idioma: VOZ.IDIOMA,
			sesgo: this.sesgar ? (this.voz.sesgoAplicado ? 'activo' : 'pedido, no aceptado') : 'no',
			enElEquipo: this.local,
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

		const sesgo = this.sesgar ? (this.voz.sesgoAplicado ? 'sí' : 'pedido') : 'no';
		return [
			`PRUEBA DE VOZ  ·  idioma ${VOZ.IDIOMA}  ·  ${this.escuchando ? '● ESCUCHANDO' : '○ parado'}`,
			`Sesgo a las letras (P): ${sesgo}   ·   Reconocer en el equipo (L): ${this.local ? 'sí' : 'no'}`,
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
			'Di cada letra con una pequeña pausa. Al terminar pulsa ENTER y espera a ver «Parado».',
			'ENTER escuchar/parar · ESPACIO otra palabra · BACKSPACE repetir · R al revés · C copiar',
			'P sesgar hacia las letras · L reconocer en el equipo',
		].join('\n');
	}
}
