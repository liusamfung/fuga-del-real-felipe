import Phaser from 'phaser';
import { CONFIG, ESCENAS, MODOS_DE_DELETREO } from '../config.js';
import { claveDeLaMusicaDelNivel } from '../datos/audio.js';
import { cartelDe } from '../datos/carteles.js';
import { NIVELES } from '../datos/niveles.js';
import { DIFICULTADES, elegirPalabra } from '../datos/palabras.js';
import { VOCABULARIO, VOCABULARIO_PARA_VOZ } from '../datos/vocabulario.js';
import { BalasEnemigas } from '../entidades/BalasEnemigas.js';
import { BalaEnemiga } from '../entidades/BalaEnemiga.js';
import { Cofre } from '../entidades/Cofre.js';
import { Enemigo } from '../entidades/Enemigo.js';
import { Granada } from '../entidades/Granada.js';
import { VistaPreviaDeLaGranada } from '../entidades/VistaPreviaDeLaGranada.js';
import { Jefe } from '../entidades/Jefe.js';
import { RayoDelJefe } from '../entidades/RayoDelJefe.js';
import { ProyectilDelJefe } from '../entidades/ProyectilDelJefe.js';
import { Jugador } from '../entidades/Jugador.js';
import { ReconocedorDeVoz } from '../sistemas/ReconocedorDeVoz.js';
import { Disparo } from '../sistemas/Disparo.js';
import { Entrada } from '../sistemas/Entrada.js';
import { generarNivel } from '../sistemas/GeneradorDeNivel.js';
import { Nivel } from '../sistemas/Nivel.js';
import { PeleaConElJefe } from '../sistemas/PeleaConElJefe.js';
import { PoderConRecarga } from '../sistemas/PoderConRecarga.js';
import { alDerrotarAlJefe, alMorir } from '../sistemas/ProgresoDelJuego.js';
import { Sonido } from '../sistemas/Sonido.js';
import { RampaDeTiempo } from '../sistemas/RampaDeTiempo.js';
import { aplicarMejora, elegirMejoraComun } from '../sistemas/Recompensas.js';
import { elegirAlAzar } from '../utilidades/azar.js';
import {
	alcanzadosPorLaExplosion,
	limitarAlRectangulo,
	rectanguloDelCuerpo,
} from '../utilidades/explosion.js';
import { puntoDeSalidaDelNido } from '../utilidades/nido.js';
import { ladoDeEsquive, largoHastaElBorde } from '../utilidades/rayo.js';
import { normalizar } from '../utilidades/vectores.js';
import { armarFicha, elegirEntrada, NIVELES_DE_INGLES } from '../utilidades/fichas.js';

// Un nivel: una cuadrícula de salas con el jugador dentro. La cámara muestra una sala a la vez.
//
// Cómo funciona una sala de combate:
//   1. El jugador entra y, cuando está bien adentro, aparecen los enemigos y se cierran las puertas.
//   2. Al morir el último enemigo se abren las puertas y sale el cofre.
//   3. Una de las 8 salas de alrededor tiene en su cofre la llave de la sala del jefe (la del centro).
export class EscenaJuego extends Phaser.Scene {
	constructor() {
		super(ESCENAS.JUEGO);
	}

	// El nivel que se juega (1 o 2) llega como dato al arrancar o reiniciar la escena: `scene.start(ESCENAS.JUEGO,
	// { nivel: 2 })`. Sin dato, el 1. Cada nivel tiene su jefe (`CONFIG.JEFES`). Al pasar de nivel llegan también las
	// `estadisticas` del jugador (su vida, su ataque…), para que las conserve; sin ellas empieza de cero.
	init(datos) {
		this.numeroDeNivel = datos?.nivel ?? 1;
		this.estadisticasGuardadas = datos?.estadisticas ?? null;
		this.configDelJefe = CONFIG.JEFES[this.numeroDeNivel];
		if (!this.configDelJefe) {
			throw new Error(`No existe el nivel ${this.numeroDeNivel}`);
		}
	}

	create() {
		this.jugadorMuerto = false;
		this.cartelAbierto = false; // verdadero mientras un cartel de fin (perdiste, nivel completado, ganaste) tapa el juego

		this.proximoAvisoDeLlave = 0;
		this.deletreoActivo = false;
		this.deletreoRecienTerminado = false; // el reto acabó en este fotograma (ver update)
		this.usarVoz = false; // provisional: la tecla V activa deletrear con el micrófono
		this.ultimasPalabrasDeIngles = []; // las últimas del dictado, para no repetirlas enseguida
		const { GRANADA } = CONFIG.PODERES;
		this.poderes = {
			granada: new PoderConRecarga({
				recargaTrasAcierto: GRANADA.RECARGA_TRAS_ACIERTO,
				recargaTrasFallo: GRANADA.RECARGA_TRAS_FALLO,
			}),
		};
		this.retoEnCurso = null; // de qué es el reto en pantalla: 'granada', 'ataque-fuerte' (del jefe) o null
		this.apuntadoDelRayo = null; // por dónde saldrá el rayo del ataque fuerte: { origen, direccion, largo }
		const JEFE = this.configDelJefe;
		this.pelea = new PeleaConElJefe({
			vidaMaxima: JEFE.VIDA,
			umbrales: JEFE.UMBRALES,
			intervaloDeAtaque: JEFE.INTERVALO_DE_ATAQUE,
			primerAtaque: JEFE.PRIMER_ATAQUE,
			nivelesDeInglesDeLosAtaquesFuertes: JEFE.NIVELES_DE_INGLES,
			devolucion: JEFE.DEVOLUCION,
			rapido: JEFE.RAPIDO,
			pausaTrasElAtaqueFuerte: JEFE.PAUSA_TRAS_EL_ATAQUE_FUERTE,
			probabilidadDeTriple: JEFE.TRIPLE.PROBABILIDAD,
			probabilidadMaximaDeRafaga: JEFE.RAFAGA.PROBABILIDAD_MAXIMA,
			disparosBaseDeLaRafaga: JEFE.RAFAGA.DISPAROS_BASE,
			disparosExtraDeLaRafaga: JEFE.RAFAGA.DISPAROS_EXTRA,
			msEntreDisparosDeLaRafaga: JEFE.RAFAGA.ENTRE_DISPAROS,
		});
		this.rafaga = null; // el temporizador de los disparos que faltan de una ráfaga
		const { CAMARA_LENTA } = CONFIG;
		this.rampa = new RampaDeTiempo({
			factor: CAMARA_LENTA.FACTOR,
			entrada: CAMARA_LENTA.ENTRADA,
			salida: CAMARA_LENTA.SALIDA,
		});
		this.estadoDeSalas = new Map(); // 'columna,fila' -> { combateIniciado, limpia, enemigosVivos, ... }
		this.entrada = new Entrada(this);
		// El sonido: la música del nivel empieza (en cuanto el navegador deja sonar: con la primera tecla) y los efectos
		// suenan desde las entidades con `escena.sonido?.efecto(...)`.
		this.sonido = new Sonido(this);
		this.sonido.musica(claveDeLaMusicaDelNivel(this.numeroDeNivel));

		this.modelo = generarNivel(NIVELES[this.numeroDeNivel]);
		this.nivel = new Nivel(this, this.modelo);
		this.cameras.main.setBounds(
			0,
			0,
			this.modelo.columnas * CONFIG.SALA.ANCHO,
			this.modelo.filas * CONFIG.SALA.ALTO,
		);

		const inicio = this.modelo.salaInicial;
		const origen = this.nivel.origenDeSala(inicio.columna, inicio.fila);
		const { x, y } = this.modelo.posicionInicialDelJugador;
		this.jugador = new Jugador(this, origen.x + x, origen.y + y, this.estadisticasGuardadas);
		this.jugador.once('muerto', () => this.#alMorirElJugador());

		this.disparo = new Disparo(this, this.nivel.bloques);
		this.vistaPreviaDeLaGranada = new VistaPreviaDeLaGranada(this);
		this.input.setDefaultCursor('crosshair');
		this.#crearColisiones();
		this.#crearElJefe();
		this.rayo = new RayoDelJefe(this, this.configDelJefe);
		this.#entrarEnSala(inicio);
		this.#mostrarMensaje(`Nivel ${this.numeroDeNivel}: ${this.modelo.nombre}`, { tamano: 28 });

		// La interfaz es otra escena que se dibuja encima.
		this.scene.launch(ESCENAS.HUD, {
			jugador: this.jugador,
			poderes: this.poderes,
			pelea: this.pelea,
		});
		this.events.once('shutdown', () => {
			this.sonido.detenerMusica();
			this.scene.stop(ESCENAS.HUD);
			this.scene.stop(ESCENAS.DELETREO);
			this.scene.stop(ESCENAS.OPCIONES);
			this.scene.stop(ESCENAS.CARTEL);
			this.#restablecerLaEscalaDelTiempo();
		});
	}

	update() {
		this.#actualizarLaVelocidadDelMundo();
		if (this.jugadorMuerto || this.cartelAbierto) {
			return;
		}

		const alternarVoz = this.entrada.vozAlternada(); // se consulta siempre, aunque no se use
		if (alternarVoz && !this.deletreoActivo) {
			this.#alternarLaVoz();
		}

		// Se consultan todas las teclas de retos en cada fotograma, aunque no se usen (JustDown "gasta"
		// la pulsación).
		const irAlJefe = this.entrada.irAlJefePedido();
		if (irAlJefe && !this.deletreoActivo) {
			this.#irALaSalaDelJefe();
		}
		// M silencia o devuelve el sonido. Mientras se escribe una palabra (dictado) la M es una letra más: no cuenta.
		const silencio = this.entrada.silencioPedido();
		if (silencio && !this.deletreoActivo) {
			const silenciado = this.sonido.alternarSilencio();
			this.#mostrarMensaje(silenciado ? 'Sonido: NO (M)' : 'Sonido: SÍ (M)', { tamano: 24 });
		}
		const irAlNivel2 = this.entrada.irAlNivel2Pedido();
		if (irAlNivel2 && !this.deletreoActivo) {
			this.scene.restart({ nivel: 2 }); // atajo de pruebas: empieza el nivel 2 desde cero
			return;
		}
		const pedido = this.entrada.deletreoPedido();
		const nivelPedido = this.entrada.retoDeOpcionesPedido();
		const granadaPedida = this.entrada.granadaPedida();
		// La letra que completa una palabra puede ser también la tecla que pide otro reto (E, T, Y, I, R, ESPACIO):
		// esa pulsación ya se gastó en el reto que acaba de terminar y no debe empezar uno nuevo.
		if (!this.deletreoActivo && !this.deletreoRecienTerminado) {
			if (pedido) {
				this.#empezarElDeletreo(pedido);
			} else if (nivelPedido) {
				this.#empezarElRetoDeOpciones(nivelPedido);
			} else if (granadaPedida) {
				this.#empezarLaGranada();
			}
		}
		this.deletreoRecienTerminado = false;

		this.#actualizarLaPelea();
		this.#actualizarLaVistaPreviaDeLaGranada();

		const direccion = this.entrada.direccionDeMovimiento();
		const puntoDeApuntado = this.entrada.puntoDeApuntado();
		if (this.entrada.dashPulsado()) {
			this.jugador.intentarDash(direccion);
		}
		this.jugador.mover(direccion);
		this.jugador.actualizarAnimacion(direccion, puntoDeApuntado);

		const centro = this.jugador.body.center;
		const sala = this.nivel.salaEn(centro.x, centro.y);
		if (sala.columna !== this.salaActual.columna || sala.fila !== this.salaActual.fila) {
			this.#entrarEnSala(sala);
		}
		this.#intentarIniciarElCombate();

		for (const enemigo of this.enemigos.getChildren()) {
			enemigo.perseguir(this.jugador);
		}

		if (puntoDeApuntado && this.entrada.estaDisparando()) {
			const { ataque } = this.jugador.estadisticas;
			this.disparo.intentarDisparar(this.jugador, puntoDeApuntado, ataque);
		}
		const limitesDeLaSala = this.nivel.limitesDeSala(this.salaActual.columna, this.salaActual.fila);
		this.disparo.actualizar(limitesDeLaSala);
		this.balasEnemigas.apagarLasQueSalieron(limitesDeLaSala);
	}

	// La cámara lenta: mientras un poder espera su reto, el mundo (enemigos, balas, animaciones y
	// temporizadores) va a una quinta parte, para que el objetivo no se haya ido cuando se acierta. Entra y
	// sale suave (RampaDeTiempo). El jugador no se mueve durante el reto, y el tiempo del reto es real: no
	// se estira. Se decide cada fotograma según el estado, así no se queda lenta por ninguna salida rara.
	#actualizarLaVelocidadDelMundo() {
		// Mientras una voz dice la palabra del dictado, el volumen del juego baja para poder oírla bien.
		this.sonido.atenuar(this.#hayUnDictadoAbierto());
		this.sonido.actualizar();
		const ahora = performance.now();
		this.rampa.fijar(this.retoEnCurso !== null && !this.jugadorMuerto, ahora);
		this.#aplicarLaEscalaDelTiempo(this.rampa.escala(ahora));
	}

	// ¿Está en pantalla un dictado (el reto en que el juego dice una palabra y se escribe)? Dura hasta que se cierra su
	// cartel de resultado. Si el navegador no sabe hablar, el dictado pasa a mostrar la palabra y no cuenta.
	#hayUnDictadoAbierto() {
		return (
			this.scene.isActive(ESCENAS.DELETREO) &&
			this.scene.get(ESCENAS.DELETREO).modo === MODOS_DE_DELETREO.DICTADO
		);
	}

	// Al cerrarse la escena (por ejemplo, en el reinicio después de morir) algunos sistemas de Phaser ya no
	// existen, y tocarlos da error: solo se restablecen los que siguen ahí. La escala de las animaciones es
	// global (la comparten todas las escenas), así que es la que no debe quedar lenta; las demás se crean de
	// nuevo con la escena.
	#restablecerLaEscalaDelTiempo() {
		if (this.anims) {
			this.anims.globalTimeScale = 1;
		}
		if (this.physics?.world) {
			this.physics.world.timeScale = 1;
		}
		if (this.time) {
			this.time.timeScale = 1;
		}
		if (this.tweens) {
			this.tweens.timeScale = 1;
		}
	}

	// `escala` 1 es normal y 0,2 es una quinta parte. La física usa la convención contraria (más grande es
	// más lento), por eso se divide.
	#aplicarLaEscalaDelTiempo(escala) {
		// La música baja de ritmo y de tono con el mundo, como una cinta que se frena.
		this.sonido.ajustarLaMusicaALaEscalaDelTiempo(escala, CONFIG.CAMARA_LENTA.FACTOR);
		this.physics.world.timeScale = 1 / escala;
		this.time.timeScale = escala;
		this.tweens.timeScale = escala;
		this.anims.globalTimeScale = escala;
	}

	// Provisional hasta el paso 9 (poderes por voz): E, T e Y piden una palabra al azar (visible, con
	// huecos, de memoria), con Mayúsculas al revés, y R una fácil al revés. I pide un dictado en inglés
	// (el juego dice la palabra y se escribe). Mientras se deletrea el jugador no puede moverse (las
	// letras W, A, S y D son las teclas de caminar), pero el juego sigue: los enemigos no esperan.
	#empezarElDeletreo({ modo, invertida }) {
		this.deletreoActivo = true;
		this.entrada.bloquearMovimiento(true);

		const esDictado = modo === MODOS_DE_DELETREO.DICTADO;
		const esLaFacilAlReves = invertida && modo === MODOS_DE_DELETREO.VISIBLE;
		const dificultad = esLaFacilAlReves ? 'facil' : elegirAlAzar(DIFICULTADES);
		this.scene.launch(ESCENAS.DELETREO, {
			palabra: esDictado ? this.#palabraParaDictar() : elegirPalabra(dificultad),
			invertida: esDictado ? false : invertida,
			modo,
			usaVoz: this.usarVoz,
			alTerminar: (resultado) => this.#alTerminarElDeletreo(resultado),
		});
	}

	// Provisional hasta el paso 9: O pide un reto de traducción (nivel 1) y P uno de definición
	// (nivel 2). Se dice la opción correcta con el micrófono; si falla, se responde con 1, 2 o 3. Como el
	// deletreo, bloquea el movimiento y le avisa al juego con `deletreo-terminado`.
	// Devuelve verdadero si el reto empezó.
	#empezarElRetoDeOpciones(nivel) {
		// Los retos por voz solo usan las palabras que Chrome reconoce bien (ver `voz` en src/datos/vocabulario.js).
		const ficha = armarFicha(
			this.#entradaDeIngles(VOCABULARIO_PARA_VOZ),
			nivel,
			VOCABULARIO_PARA_VOZ,
		);
		if (!ficha) {
			return false; // el banco no alcanzó para armar las opciones (con 60 palabras no pasa)
		}

		this.deletreoActivo = true;
		this.entrada.bloquearMovimiento(true);
		this.scene.launch(ESCENAS.OPCIONES, {
			ficha,
			alTerminar: (resultado, info) => this.#alTerminarElDeletreo(resultado, info),
		});
		return true;
	}

	// ESPACIO: la granada (el ataque especial). Si está lista, se abre un reto de inglés (nivel 1); al acertarlo se lanza hacia donde
	// apunta el cursor. Mientras se responde, el juego sigue a velocidad normal (la cámara lenta es solo
	// para los ataques fuertes del jefe). Si no está lista (recargando), no pasa nada.
	#empezarLaGranada() {
		const ahora = this.time.now;
		if (!this.poderes.granada.intentarUsar(ahora)) {
			return;
		}

		this.retoEnCurso = 'granada';
		if (!this.#empezarElRetoDeOpciones(CONFIG.PODERES.GRANADA.NIVEL_DE_INGLES)) {
			this.retoEnCurso = null;
			this.poderes.granada.terminar(false, ahora); // no hubo reto: que no quede esperando para siempre
		}
	}

	// Mientras se responde el reto de la granada se ve dónde caería (la línea y el círculo de la explosión), siguiendo
	// al cursor. Fuera del reto, o si el jugador murió, no se ve.
	#actualizarLaVistaPreviaDeLaGranada() {
		if (this.retoEnCurso !== 'granada' || this.jugadorMuerto) {
			this.vistaPreviaDeLaGranada.ocultar();
			return;
		}
		this.vistaPreviaDeLaGranada.mostrar(
			this.jugador.body.center,
			this.#destinoDeLaGranada(),
			CONFIG.PODERES.GRANADA.RADIO,
		);
	}

	// El reto de la granada terminó: si se acertó, se lanza; si no, no hay granada y la recarga es corta.
	#alTerminarLaGranada(resultado) {
		this.vistaPreviaDeLaGranada.ocultar();
		const acerto = resultado === 'acertada';
		this.poderes.granada.terminar(acerto, this.time.now);
		if (acerto) {
			this.#lanzarLaGranada();
		} else {
			this.#mostrarMensaje('Falló la granada', { tamano: 20 });
		}
	}

	// Dónde caería la granada ahora mismo: hacia donde apunta el cursor, sin salir de la sala. Si el ratón todavía no
	// se ha movido, un poco a la derecha del jugador. Lo usan tanto el lanzamiento como la vista previa.
	#destinoDeLaGranada() {
		const origen = this.jugador.body.center;
		const apuntado = this.entrada.puntoDeApuntado() ?? { x: origen.x + 160, y: origen.y };
		const limites = this.nivel.limitesDeSala(this.salaActual.columna, this.salaActual.fila);
		return limitarAlRectangulo(apuntado, limites);
	}

	// Sale del jugador hacia donde apunta el cursor en este momento (sin salir de la sala).
	#lanzarLaGranada() {
		const origen = this.jugador.body.center;
		const destino = this.#destinoDeLaGranada();

		new Granada(this, origen.x, origen.y).lanzar(destino, (punto) =>
			this.#explotarLaGranada(punto),
		);
	}

	// La explosión: daño a todos los enemigos dentro del radio y una onda naranja que se desvanece.
	#explotarLaGranada(punto) {
		const { RADIO, DANO, DURACION_DE_LA_EXPLOSION } = CONFIG.PODERES.GRANADA;

		const enemigos = this.enemigos.getChildren().filter((enemigo) => enemigo.active);
		// Cada objetivo cuenta con su CUERPO (centro, ancho y alto), no solo con su centro: basta con que el círculo lo roce.
		const cuerpos = enemigos.map((enemigo) => ({ enemigo, ...rectanguloDelCuerpo(enemigo.body) }));
		for (const { enemigo } of alcanzadosPorLaExplosion(punto, RADIO, cuerpos)) {
			enemigo.recibirDano(DANO);
		}

		// La explosión también daña los nidos que alcance (cuenta su dibujo entero: miden 64 × 64).
		const nidos = this.nivel.nidos
			.getChildren()
			.filter((nido) => nido.active)
			.map((nido) => ({ nido, x: nido.x, y: nido.y, ancho: nido.width, alto: nido.height }));
		for (const { nido } of alcanzadosPorLaExplosion(punto, RADIO, nidos)) {
			nido.recibirDano(DANO);
		}

		// Y al jefe, si la pelea está en marcha (cuenta su cuerpo entero).
		if (this.jefe.active && this.pelea.vulnerable) {
			const cuerpoDelJefe = rectanguloDelCuerpo(this.jefe.body);
			if (alcanzadosPorLaExplosion(punto, RADIO, [cuerpoDelJefe]).length > 0) {
				const { derrotado } = this.pelea.recibirDano(DANO);
				this.jefe.destellar();
				if (derrotado) {
					this.#alDerrotarAlJefe();
				}
			}
		}

		const onda = this.add
			.circle(punto.x, punto.y, RADIO, 0xff9a3c, 0.5)
			.setStrokeStyle(3, 0xfff1b8)
			.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS)
			.setScale(0.3);
		this.tweens.add({
			targets: onda,
			scale: 1,
			alpha: 0,
			duration: DURACION_DE_LA_EXPLOSION,
			onComplete: () => onda.destroy(),
		});
	}

	// Una palabra de `banco` (el de voz o el completo), que no sea de las últimas que salieron.
	#entradaDeIngles(banco) {
		const entrada = elegirEntrada(banco, { evitar: this.ultimasPalabrasDeIngles });
		this.ultimasPalabrasDeIngles = [...this.ultimasPalabrasDeIngles, entrada.palabra].slice(
			-CONFIG.INGLES.NO_REPETIR,
		);
		return entrada;
	}

	#palabraParaDictar() {
		// El dictado se escribe con el teclado: puede usar todas las palabras, también las que Chrome no entiende.
		return armarFicha(this.#entradaDeIngles(VOCABULARIO), NIVELES_DE_INGLES.DICTADO, VOCABULARIO)
			.palabra;
	}

	// Provisional hasta el paso 9: la tecla V cambia entre deletrear con el teclado y con la voz. La
	// primera vez que se deletrea con la voz, el navegador pide permiso para el micrófono.
	#alternarLaVoz() {
		if (!ReconocedorDeVoz.disponible()) {
			this.#mostrarMensaje('Este navegador no tiene voz: usa Chrome', { tamano: 20 });
			return;
		}

		this.usarVoz = !this.usarVoz;
		this.#mostrarMensaje(this.usarVoz ? 'Deletreo: VOZ' : 'Deletreo: TECLADO', { tamano: 24 });
	}

	/** `resultado` es 'acertada', 'fallada' o 'tiempo-agotado'. */
	#alTerminarElDeletreo(resultado, info) {
		this.deletreoActivo = false;
		this.deletreoRecienTerminado = true;
		this.entrada.bloquearMovimiento(false);
		this.events.emit('deletreo-terminado', resultado);

		// Si el reto era el de un poder, se resuelve ahora (el evento de arriba es para quien más lo necesite).
		if (this.retoEnCurso === 'granada') {
			this.retoEnCurso = null;
			this.#alTerminarLaGranada(resultado);
		} else if (this.retoEnCurso === 'ataque-fuerte') {
			this.retoEnCurso = null;
			this.#alTerminarElAtaqueFuerte(resultado, info?.fraccionRestante ?? 0);
		}
	}

	// El jefe flota en el centro de su sala. Hasta que el jugador entra no ataca ni recibe daño; entonces empieza
	// la pelea (ver `PeleaConElJefe` y docs/mecanicas.md, sección 6).
	#crearElJefe() {
		const { columna, fila } = this.modelo.salaDelJefe;
		const origen = this.nivel.origenDeSala(columna, fila);
		this.jefe = new Jefe(
			this,
			origen.x + CONFIG.SALA.ANCHO / 2,
			origen.y + CONFIG.SALA.ALTO / 2,
			this.configDelJefe,
		);

		const { bloques, puertas } = this.nivel;
		// Es sólido: el jugador no lo atraviesa y, si lo toca durante la pelea, le quita un corazón.
		this.physics.add.collider(this.jugador, this.jefe, () => {
			if (this.pelea.vulnerable) {
				this.jugador.recibirDano(this.configDelJefe.DANO_POR_TOCARLO);
			}
		});
		// Las balas del jugador lo golpean (antes de la pelea y después de derrotarlo no le hacen nada).
		this.physics.add.overlap(this.disparo.balas, this.jefe, (a, b) =>
			this.#alImpactarUnaBalaEnElJefe(a === this.jefe ? b : a),
		);
		// Sus proyectiles se detienen en las paredes y las puertas cerradas, y le quitan vida al jugador.
		this.physics.add.collider(this.jefe.proyectiles, bloques, (proyectil) =>
			proyectil.desactivar(),
		);
		this.physics.add.collider(this.jefe.proyectiles, puertas, (proyectil) =>
			proyectil.desactivar(),
		);
		this.physics.add.overlap(this.jugador, this.jefe.proyectiles, (a, b) => {
			const proyectil = [a, b].find((objeto) => objeto instanceof ProyectilDelJefe);
			if (proyectil?.active) {
				this.jugador.recibirDano(proyectil.dano);
				proyectil.desactivar();
			}
		});
	}

	// La pelea empieza cuando el jugador ya está bien adentro de la sala del jefe: se cierran las puertas.
	#intentarEmpezarLaPelea(datos, estado) {
		if (estado.combateIniciado) {
			return;
		}

		const centro = this.jugador.body.center;
		if (!this.nivel.estaAdentro(centro.x, centro.y, datos.columna, datos.fila)) {
			return;
		}

		estado.combateIniciado = true;
		this.nivel.cerrarPuertas(datos.columna, datos.fila);
		this.pelea.empezar(this.time.now);
		this.#mostrarMensaje('¡El jefe!');
	}

	// Cada fotograma: la pelea dice qué hace el jefe (un ataque básico o uno fuerte) y aquí se hace. El ataque
	// fuerte no empieza mientras el jugador responde otro reto (la granada), y los básicos siguen igual.
	#actualizarLaPelea() {
		if (this.jugadorMuerto) {
			return;
		}

		const acciones = this.pelea.actualizar(this.time.now, { libre: !this.deletreoActivo });
		for (const accion of acciones) {
			if (accion.tipo === 'ataque-basico') {
				this.#lanzarElAtaqueBasico(accion);
			} else if (accion.tipo === 'ataque-fuerte') {
				this.#avisarDelAtaqueFuerte(accion.nivel);
			}
		}
	}

	// Los tres ataques básicos: un proyectil, tres a la vez en abanico (uno al jugador y uno a cada lado) o una
	// ráfaga de varios seguidos, cada uno hacia donde está el jugador en ese momento.
	#lanzarElAtaqueBasico({ patron, disparos }) {
		this.sonido.efecto('fantasma-ataque-basico'); // un sonido por ataque, también en la ráfaga
		if (patron === 'triple') {
			this.jefe.lanzarUnAbanico(this.jugador, 3, this.configDelJefe.TRIPLE.APERTURA);
			return;
		}
		if (patron !== 'rafaga') {
			this.jefe.lanzarUnProyectil(this.jugador);
			return;
		}

		this.#cancelarLaRafaga();
		this.jefe.lanzarUnProyectil(this.jugador); // el primero sale ya
		if (disparos > 1) {
			this.rafaga = this.time.addEvent({
				delay: this.configDelJefe.RAFAGA.ENTRE_DISPAROS,
				repeat: disparos - 2,
				callback: () => {
					// Si empezó un ataque fuerte o el jefe cayó, los disparos que faltaban ya no salen.
					if (this.jefe.active && this.pelea.estado === 'peleando') {
						this.jefe.lanzarUnProyectil(this.jugador);
					} else {
						this.#cancelarLaRafaga();
					}
				},
			});
		}
	}

	#cancelarLaRafaga() {
		this.rafaga?.remove(false);
		this.rafaga = null;
	}

	// Primero el aviso: el jefe destella y sale un letrero. Mientras tanto no se puede abrir otro reto. Cuando
	// acaba el aviso, aparece el reto de inglés con el mundo en cámara lenta.
	#avisarDelAtaqueFuerte(nivel) {
		this.#cancelarLaRafaga();
		this.deletreoActivo = true; // reservado: durante el aviso no se puede abrir otro reto
		this.#mostrarMensaje('¡ATAQUE FUERTE!', { x: this.jefe.x, y: this.jefe.y - 100, tamano: 26 });
		this.time.addEvent({
			delay: 160,
			repeat: 4,
			callback: () => this.jefe.active && this.jefe.destellar(),
		});
		this.time.delayedCall(this.configDelJefe.AVISO, () => this.#abrirElRetoDelAtaqueFuerte(nivel));
	}

	// El reto más difícil del ataque fuerte (nivel 3): una voz dice una palabra en inglés y hay que escribirla con el
	// teclado antes de que se acabe el tiempo (el tiempo corre en tiempo real, aunque el mundo vaya en cámara lenta).
	// Usa todas las palabras del banco: se teclea, no depende de que Chrome las entienda. Devuelve verdadero si empezó.
	#empezarElDictadoDelAtaqueFuerte() {
		this.deletreoActivo = true;
		this.entrada.bloquearMovimiento(true);
		this.scene.launch(ESCENAS.DELETREO, {
			palabra: this.#palabraParaDictar(),
			modo: MODOS_DE_DELETREO.DICTADO,
			alTerminar: (resultado, info) => this.#alTerminarElDeletreo(resultado, info),
		});
		return true;
	}

	#abrirElRetoDelAtaqueFuerte(nivel) {
		if (this.jugadorMuerto || this.pelea.derrotado) {
			this.deletreoActivo = false;
			return;
		}

		this.#apuntarElRayo();
		this.retoEnCurso = 'ataque-fuerte';
		// El nivel 3 de inglés (el más difícil, solo del jefe 2) es el dictado: el juego dice la palabra y se escribe con el
		// teclado. Los niveles 1 y 2 son retos de opciones que se dicen con la voz.
		const empezo =
			nivel === NIVELES_DE_INGLES.DICTADO
				? this.#empezarElDictadoDelAtaqueFuerte()
				: this.#empezarElRetoDeOpciones(nivel);
		if (!empezo) {
			// No se pudo armar el reto (con el banco de vocabulario no pasa): que el jugador no pague por eso.
			this.retoEnCurso = null;
			this.deletreoActivo = false;
			this.#alTerminarElAtaqueFuerte('acertada', 0);
		}
	}

	// Fija por dónde saldrá el rayo del ataque fuerte: del centro del jefe hacia donde está el jugador en este
	// momento, hasta el final de la sala. Desde que aparece el reto el jugador ya no se mueve, así que el rayo le
	// cae encima si falla; no hay forma de esquivarlo caminando.
	#apuntarElRayo() {
		const origen = { x: this.jefe.body.center.x, y: this.jefe.body.center.y };
		const objetivo = this.jugador.body.center;
		let direccion = normalizar(objetivo.x - origen.x, objetivo.y - origen.y);
		if (direccion.x === 0 && direccion.y === 0) {
			direccion = { x: 0, y: 1 }; // el jugador está justo encima del centro del jefe: hacia abajo
		}

		const largo = largoHastaElBorde(origen, direccion, this.#interiorDeLaSalaDelJefe());
		this.apuntadoDelRayo = { origen, direccion, largo };
		this.rayo.apuntar(this.apuntadoDelRayo);
	}

	// El rectángulo de la sala del jefe por dentro de las paredes: hasta ahí llega el rayo.
	#interiorDeLaSalaDelJefe() {
		const { columna, fila } = this.modelo.salaDelJefe;
		const { x, y, ancho, alto } = this.nivel.limitesDeSala(columna, fila);
		const { CASILLA } = CONFIG.SALA;
		return { x: x + CASILLA, y: y + CASILLA, ancho: ancho - 2 * CASILLA, alto: alto - 2 * CASILLA };
	}

	// El reto del ataque fuerte terminó y el rayo sale. Según cómo salió:
	//   - se falló: el rayo le cae al jugador sí o sí (aunque estuviera en su inmunidad);
	//   - se acertó: el jugador hace un dash automático hacia un lado, fuera del camino del rayo, y el rayo pasa de
	//     largo (sale un instante después, para que se vea que el dash fue primero);
	//   - se acertó rápido (en la primera mitad del tiempo): además, el golpe se le devuelve al jefe.
	#alTerminarElAtaqueFuerte(resultado, fraccionRestante) {
		const fin = this.pelea.terminarAtaqueFuerte(resultado, fraccionRestante, this.time.now);
		if (!fin) {
			this.rayo.ocultar(); // el jefe ya había sido derrotado mientras se respondía
			return;
		}

		const { x, y } = this.jefe;
		if (fin.desenlace === 'golpe') {
			this.rayo.disparar(this.apuntadoDelRayo);
			this.jugador.inmuneHasta = 0;
			this.jugador.recibirDano(this.configDelJefe.DANO_DEL_GOLPE);
			this.cameras.main.shake(260, 0.012);
			this.#mostrarMensaje('¡Te golpeó!', { x, y: y - 100, tamano: 24 });
		} else {
			const { direccion } = this.apuntadoDelRayo;
			const lado = ladoDeEsquive(
				direccion,
				this.jugador.body.center,
				this.#interiorDeLaSalaDelJefe(),
			);
			// El dash va a velocidad completa: se corta la cámara lenta en vez de dejarla salir poco a poco.
			this.rampa.cortar();
			this.#aplicarLaEscalaDelTiempo(1);
			this.jugador.esquivarConDash(lado);
			this.rayo.disparar(this.apuntadoDelRayo, {
				retraso: this.configDelJefe.RAYO.RETRASO_SI_ESQUIVA,
			});
			this.cameras.main.shake(160, 0.006);

			if (fin.desenlace === 'devuelto') {
				this.jefe.destellar();
				this.#mostrarMensaje('¡Dash y contraataque!', { x, y: y - 100, tamano: 24 });
			} else {
				this.#mostrarMensaje('¡Dash automático!', { x, y: y - 100, tamano: 24 });
			}
		}

		if (fin.derrotado) {
			this.#alDerrotarAlJefe();
		}
	}

	// Una bala del jugador da en el jefe: desaparece, y si la pelea está en marcha le quita vida.
	#alImpactarUnaBalaEnElJefe(bala) {
		if (!bala.active) {
			return;
		}

		bala.desactivar();
		if (!this.pelea.vulnerable) {
			return;
		}

		const { derrotado } = this.pelea.recibirDano(bala.dano);
		this.jefe.destellar();
		if (derrotado) {
			this.#alDerrotarAlJefe();
		}
	}

	// El jefe se quedó sin vida: se desvanece, se apagan sus proyectiles y se abren las puertas.
	#alDerrotarAlJefe() {
		const { columna, fila } = this.modelo.salaDelJefe;
		const estado = this.#estadoDe(columna, fila);
		if (estado.limpia) {
			return;
		}

		estado.limpia = true;
		this.#cancelarLaRafaga();
		this.rayo.ocultar();
		this.jefe.apagarLosProyectiles();
		this.jefe.body.enable = false;

		// Si se le derrotó en pleno reto del ataque fuerte (con una bala o la granada), el reto ya no importa.
		if (this.retoEnCurso === 'ataque-fuerte') {
			this.retoEnCurso = null;
			this.scene.stop(ESCENAS.OPCIONES);
			this.scene.stop(ESCENAS.DELETREO); // si el reto era un dictado
			this.deletreoActivo = false;
			this.entrada.bloquearMovimiento(false);
		}

		this.tweens.add({
			targets: this.jefe,
			alpha: 0,
			scale: this.configDelJefe.ESCALA * 1.4,
			duration: 900,
			onComplete: () => this.jefe.destroy(),
		});
		this.nivel.abrirPuertas(columna, fila);
		this.events.emit('jefe-derrotado');
		this.#mostrarMensaje('¡Derrotaste al jefe!');

		// Con el jefe del nivel 1 se pasa al nivel 2; con el del último nivel se gana el juego (no hay más niveles).
		const desenlace = alDerrotarAlJefe(this.numeroDeNivel, Object.keys(NIVELES).length);
		this.time.delayedCall(CONFIG.CARTEL.RETRASO_TRAS_EL_JEFE, () => {
			if (!this.jugadorMuerto) {
				this.#abrirElCartel(desenlace);
			}
		});
	}

	// Atajo de pruebas (tecla J): lleva al jugador directo a la sala del jefe, para no recorrer las otras ocho. La
	// sala donde estaba se da por terminada sin premio (para que no queden sus puertas cerradas), el jugador recibe
	// la llave y la sala del jefe queda abierta; el jugador aparece abajo y la pelea empieza al instante.
	#irALaSalaDelJefe() {
		const sala = this.modelo.salaDelJefe;
		if (this.#estadoDe(sala.columna, sala.fila).combateIniciado) {
			this.#mostrarMensaje(
				this.pelea.derrotado ? 'El jefe ya fue derrotado' : 'Ya estás en la pelea',
				{ tamano: 24 },
			);
			return;
		}

		this.#darPorTerminadaLaSalaActual();
		this.jugador.recogerLlave();
		this.nivel.desbloquearSalaDelJefe();

		const origen = this.nivel.origenDeSala(sala.columna, sala.fila);
		this.jugador.body.reset(origen.x + CONFIG.SALA.ANCHO / 2, origen.y + CONFIG.SALA.ALTO - 120);
		this.#entrarEnSala(sala);
	}

	// Si la sala donde está el jugador está en pleno combate, la da por terminada: quita sus enemigos y el
	// temporizador de su nido y abre sus puertas. No hay cofre ni mensaje: solo es para poder irse.
	#darPorTerminadaLaSalaActual() {
		const { columna, fila } = this.salaActual;
		const estado = this.#estadoDe(columna, fila);
		if (!estado.combateIniciado || estado.limpia) {
			return;
		}

		estado.temporizadorDelNido?.remove();
		this.enemigos.clear(true, true);
		Object.assign(estado, { enemigosVivos: 0, nidoVivo: false, limpia: true });
		this.nivel.abrirPuertas(columna, fila);
	}

	#crearColisiones() {
		const { bloques, puertas, nidos } = this.nivel;

		// Debe ser un grupo de física (no `this.add.group()`): con un grupo normal Phaser entrega
		// los objetos de un choque en orden invertido (enemigo, bala) y el callback falla.
		// Solo tiene los enemigos de la sala donde está el jugador.
		this.enemigos = this.physics.add.group();

		this.physics.add.collider(this.jugador, bloques);
		this.physics.add.collider(this.jugador, nidos);
		this.physics.add.collider(this.jugador, puertas, (_jugador, puerta) =>
			this.#alTocarUnaPuerta(puerta),
		);
		this.physics.add.collider(this.enemigos, bloques);
		this.physics.add.collider(this.enemigos, nidos);
		this.physics.add.collider(this.enemigos, puertas);
		this.physics.add.collider(this.enemigos, this.enemigos);
		this.physics.add.collider(this.jugador, this.enemigos, (_jugador, enemigo) =>
			this.#alTocarUnEnemigo(enemigo),
		);
		this.physics.add.collider(this.disparo.balas, puertas, (bala) => bala.desactivar());

		// Las balas de los guardias (nivel 2): se detienen en paredes, cajas, nidos y puertas cerradas, y le quitan
		// vida al jugador. Un solo grupo para toda la escena (ver `BalasEnemigas`).
		this.balasEnemigas = new BalasEnemigas(this);
		const balas = this.balasEnemigas.grupo;
		this.physics.add.collider(balas, bloques, (bala) => bala.desactivar());
		this.physics.add.collider(balas, puertas, (bala) => bala.desactivar());
		this.physics.add.collider(balas, nidos, (bala) => bala.desactivar());
		this.physics.add.overlap(this.jugador, balas, (a, b) => {
			const bala = [a, b].find((objeto) => objeto instanceof BalaEnemiga);
			if (bala?.active) {
				this.jugador.recibirDano(bala.dano);
				bala.desactivar();
			}
		});
		this.physics.add.overlap(this.disparo.balas, this.enemigos, (bala, enemigo) =>
			this.#alImpactarUnaBala(bala, enemigo),
		);
		// Las balas no atraviesan un nido: lo dañan y desaparecen. Se rompe a balazos.
		this.physics.add.overlap(this.disparo.balas, nidos, (bala, nido) =>
			this.#alImpactarUnaBalaEnUnNido(bala, nido),
		);
		for (const nido of nidos.getChildren()) {
			nido.once('roto', () => this.#alRomperseUnNido(nido));
		}
	}

	/** El estado de una sala (si ya empezó el combate, si está limpia…). Se crea al pedirlo. */
	#estadoDe(columna, fila) {
		const clave = `${columna},${fila}`;
		if (!this.estadoDeSalas.has(clave)) {
			this.estadoDeSalas.set(clave, {
				combateIniciado: false,
				limpia: false,
				enemigosVivos: 0,
				nidoVivo: false, // verdadero mientras el nido de la sala siga en pie (desde que empieza el combate)
				temporizadorDelNido: null,
				avisoDelJefe: false,
			});
		}
		return this.estadoDeSalas.get(clave);
	}

	/** La cámara salta a la sala. Se llama cuando el jugador cruza de una sala a otra. */
	#entrarEnSala(sala) {
		this.salaActual = { columna: sala.columna, fila: sala.fila };
		const origen = this.nivel.origenDeSala(sala.columna, sala.fila);
		this.cameras.main.setScroll(origen.x, origen.y);

		const datos = this.nivel.buscarSala(sala.columna, sala.fila);
		const estado = this.#estadoDe(sala.columna, sala.fila);
		if (datos.tipo === 'jefe' && !estado.avisoDelJefe) {
			estado.avisoDelJefe = true;
			this.#mostrarMensaje('Sala del jefe');
		}
	}

	/** Empieza el combate de la sala actual cuando el jugador ya está bien adentro. */
	#intentarIniciarElCombate() {
		const { columna, fila } = this.salaActual;
		const datos = this.nivel.buscarSala(columna, fila);
		const estado = this.#estadoDe(columna, fila);
		if (datos.tipo === 'jefe') {
			this.#intentarEmpezarLaPelea(datos, estado);
			return;
		}
		if (estado.combateIniciado || datos.enemigos.length === 0) {
			return;
		}

		const centro = this.jugador.body.center;
		if (!this.nivel.estaAdentro(centro.x, centro.y, columna, fila)) {
			return;
		}

		estado.combateIniciado = true;
		estado.enemigosVivos = datos.enemigos.length;
		this.nivel.cerrarPuertas(columna, fila);

		// Si la sala tiene su nido en pie, empieza a soltar ratas y la sala no se limpia hasta romperlo.
		const nido = this.nivel.nidoDe(columna, fila);
		estado.nidoVivo = nido !== undefined;
		if (nido) {
			estado.temporizadorDelNido = this.time.addEvent({
				delay: CONFIG.NIDO.INTERVALO,
				loop: true,
				callback: () => this.#soltarUnaRata(datos, nido, estado),
			});
		}

		const origen = this.nivel.origenDeSala(columna, fila);
		for (const { tipo, x, y } of datos.enemigos) {
			const enemigo = new Enemigo(this, origen.x + x, origen.y + y, tipo);
			enemigo.once('muerto', () => this.#alMorirUnEnemigo(datos));
			this.enemigos.add(enemigo);
		}
	}

	#alImpactarUnaBala(bala, enemigo) {
		if (!bala.active || !enemigo.active) {
			return;
		}
		enemigo.recibirDano(bala.dano);
		bala.desactivar();
	}

	// Un enemigo toca al jugador: le quita vida y, si tiene sonido de ataque (las ratas), suena. El choque se repite en cada
	// fotograma mientras se tocan; el catálogo de audio limita cada cuánto suena (`separacion`).
	#alTocarUnEnemigo(enemigo) {
		this.jugador.recibirDano(enemigo.dano);
		if (enemigo.datos.sonidoDeAtaque) {
			this.sonido.efecto(enemigo.datos.sonidoDeAtaque);
		}
	}

	#alMorirUnEnemigo(datos) {
		const estado = this.#estadoDe(datos.columna, datos.fila);
		estado.enemigosVivos -= 1;
		this.#revisarSiLaSalaQuedoLimpia(datos);
	}

	// Una bala que da en un nido: lo daña con el ataque del jugador y desaparece.
	#alImpactarUnaBalaEnUnNido(bala, nido) {
		if (!bala.active || !nido.active) {
			return;
		}
		nido.recibirDano(bala.dano);
		bala.desactivar();
	}

	// Cada cierto tiempo, el nido en pie suelta una rata junto a él (hacia el interior de la sala), salvo que
	// ya haya demasiadas ratas suyas vivas, que no quepa ninguna o que el jugador esté justo ahí.
	#soltarUnaRata(datos, nido, estado) {
		const { MAX_VIVAS, TIPO, DISTANCIA_AL_JUGADOR } = CONFIG.NIDO;
		const suyas = this.enemigos.getChildren().filter((e) => e.active && e.delNido === nido);
		if (!nido.active || suyas.length >= MAX_VIVAS) {
			return;
		}

		const origen = this.nivel.origenDeSala(datos.columna, datos.fila);
		const rectangulo = {
			x: nido.x - origen.x - CONFIG.NIDO.ANCHO / 2,
			y: nido.y - origen.y - CONFIG.NIDO.ALTO / 2,
			ancho: CONFIG.NIDO.ANCHO,
			alto: CONFIG.NIDO.ALTO,
		};
		const { ANCHO, ALTO, CASILLA } = CONFIG.SALA;
		const punto = puntoDeSalidaDelNido(
			rectangulo,
			datos.obstaculos,
			{ ancho: ANCHO, alto: ALTO, grosor: CASILLA },
			{ ancho: CONFIG.ENEMIGO.ANCHO, alto: CONFIG.ENEMIGO.ALTO },
		);
		if (!punto) {
			return;
		}

		const centro = this.jugador.body.center;
		const x = origen.x + punto.x;
		const y = origen.y + punto.y;
		if (Math.hypot(centro.x - x, centro.y - y) < DISTANCIA_AL_JUGADOR) {
			return; // el jugador está justo ahí: esta vez no sale, para no aparecer encima de él
		}

		const rata = new Enemigo(this, x, y, TIPO);
		rata.delNido = nido;
		estado.enemigosVivos += 1;
		rata.once('muerto', () => this.#alMorirUnEnemigo(datos));
		this.enemigos.add(rata);
	}

	// El nido se rompió: no salen más ratas. Si no queda ninguna viva, la sala queda limpia.
	#alRomperseUnNido(nido) {
		const { columna, fila } = nido.sala;
		const estado = this.#estadoDe(columna, fila);
		estado.nidoVivo = false;
		estado.temporizadorDelNido?.remove();

		this.#mostrarMensaje('¡Nido destruido!', { x: nido.x, y: nido.y - 50, tamano: 18, sube: true });
		const onda = this.add
			.circle(nido.x, nido.y, 40, 0xc0392b, 0.5)
			.setStrokeStyle(3, 0xfff1b8)
			.setDepth(CONFIG.DISPARO.PROFUNDIDAD_BALAS)
			.setScale(0.3);
		this.tweens.add({
			targets: onda,
			scale: 1.6,
			alpha: 0,
			duration: 300,
			onComplete: () => onda.destroy(),
		});

		this.#revisarSiLaSalaQuedoLimpia(this.nivel.buscarSala(columna, fila));
	}

	// La sala queda limpia cuando ya empezó el combate, no quedan enemigos vivos y el nido está roto.
	#revisarSiLaSalaQuedoLimpia(datos) {
		const estado = this.#estadoDe(datos.columna, datos.fila);
		if (estado.limpia || !estado.combateIniciado || estado.enemigosVivos > 0 || estado.nidoVivo) {
			return;
		}

		estado.limpia = true;
		this.balasEnemigas.apagarTodas(); // las balas que quedaban en el aire ya no hacen falta
		this.nivel.abrirPuertas(datos.columna, datos.fila);
		this.events.emit('sala-limpia', datos);
		this.#mostrarMensaje('¡Sala limpia!');
		if (datos.cofre) {
			this.#aparecerCofre(datos);
		}
	}

	#aparecerCofre(datos) {
		const origen = this.nivel.origenDeSala(datos.columna, datos.fila);
		const { x, y, conLlave } = datos.cofre;
		const cofre = new Cofre(this, origen.x + x, origen.y + y, elegirMejoraComun(), conLlave);
		this.physics.add.collider(this.jugador, cofre, () => this.#alTocarElCofre(cofre));
	}

	#alTocarElCofre(cofre) {
		const premio = cofre.abrir();
		if (premio === null) {
			return; // ya estaba abierto
		}

		const texto = aplicarMejora(this.jugador, premio.mejora);
		this.#mostrarMensaje(texto, { x: cofre.x, y: cofre.y - 40, tamano: 18, sube: true });

		// Provisional: el cofre con la llave da también su mejora. Ver docs/decisiones-pendientes.md.
		if (premio.conLlave) {
			this.jugador.recogerLlave();
			this.#mostrarMensaje('¡Llave del jefe!', {
				x: cofre.x,
				y: cofre.y - 70,
				tamano: 18,
				sube: true,
			});
		}
	}

	#alTocarUnaPuerta(puerta) {
		if (!puerta.bloqueadaPorLlave) {
			return;
		}

		if (this.jugador.tieneLlave) {
			this.nivel.desbloquearSalaDelJefe();
			this.#mostrarMensaje('¡Sala del jefe abierta!');
			return;
		}

		// El choque se repite en cada fotograma: el aviso sale como máximo cada 2 segundos.
		if (this.time.now >= this.proximoAvisoDeLlave) {
			this.proximoAvisoDeLlave = this.time.now + 2000;
			this.#mostrarMensaje('Necesitas la llave', { tamano: 24 });
		}
	}

	// El jugador murió: se para todo, suena su muerte y, tras un instante, sale el cartel «Perdiste». Al aceptarlo la
	// partida empieza de nuevo DESDE EL NIVEL 1, esté en el nivel que esté (ver `alMorir`).
	#alMorirElJugador() {
		this.jugadorMuerto = true;
		this.physics.pause();
		// Un reto de inglés que estuviera abierto se cierra (y con él el micrófono): el cartel no debe quedar debajo ni
		// seguir escuchando.
		this.scene.stop(ESCENAS.OPCIONES);
		this.scene.stop(ESCENAS.DELETREO);
		this.deletreoActivo = false;
		this.retoEnCurso = null;
		this.vistaPreviaDeLaGranada.ocultar();
		this.sonido.detenerMusica();
		this.sonido.efecto('jugador-muerte');
		this.time.delayedCall(CONFIG.CARTEL.RETRASO_TRAS_MORIR, () => this.#abrirElCartel(alMorir()));
	}

	// Tapa el juego con un cartel y espera a que el jugador pulse el botón: entonces empieza el nivel que indica el
	// desenlace (`siguiente`). El juego queda congelado mientras tanto.
	#abrirElCartel(desenlace) {
		if (this.cartelAbierto) {
			return;
		}

		this.cartelAbierto = true;
		this.physics.pause();
		this.scene.launch(ESCENAS.CARTEL, {
			cartel: cartelDe(desenlace),
			alAceptar: () =>
				this.scene.restart({
					nivel: desenlace.siguiente,
					// Al pasar de nivel el jugador conserva sus estadísticas; al volver a empezar, no.
					estadisticas: desenlace.conservaEstadisticas ? { ...this.jugador.estadisticas } : null,
				}),
		});
	}

	/** Muestra un texto que se desvanece. Por defecto sale en el centro de la sala actual. */
	#mostrarMensaje(texto, { x, y, tamano = 32, sube = false } = {}) {
		const origen = this.nivel.origenDeSala(this.salaActual.columna, this.salaActual.fila);
		const posicionX = x ?? origen.x + CONFIG.SALA.ANCHO / 2;
		const posicionY = y ?? origen.y + CONFIG.SALA.ALTO / 2;

		const mensaje = this.add
			.text(posicionX, posicionY, texto, {
				fontFamily: 'monospace',
				fontSize: `${tamano}px`,
				color: '#c9b79c',
			})
			.setOrigin(0.5)
			.setDepth(CONFIG.PROFUNDIDAD_MENSAJES);

		this.tweens.add({
			targets: mensaje,
			alpha: 0,
			y: sube ? posicionY - 30 : posicionY,
			delay: 1200,
			duration: 600,
			onComplete: () => mensaje.destroy(),
		});
	}
}
