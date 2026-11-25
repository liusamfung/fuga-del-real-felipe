import Phaser from 'phaser';
import { CONFIG, ESCENAS } from '../config.js';
import { NIVEL_1 } from '../datos/niveles.js';
import { Cofre } from '../entidades/Cofre.js';
import { EnemigoDebil } from '../entidades/EnemigoDebil.js';
import { Jugador } from '../entidades/Jugador.js';
import { Disparo } from '../sistemas/Disparo.js';
import { Entrada } from '../sistemas/Entrada.js';
import { generarNivel } from '../sistemas/GeneradorDeNivel.js';
import { Nivel } from '../sistemas/Nivel.js';
import { aplicarMejora, elegirMejoraComun } from '../sistemas/Recompensas.js';

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

	create() {
		this.jugadorMuerto = false;
		this.proximoAvisoDeLlave = 0;
		this.estadoDeSalas = new Map(); // 'columna,fila' -> { combateIniciado, limpia, enemigosVivos, ... }
		this.entrada = new Entrada(this);

		this.modelo = generarNivel(NIVEL_1);
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
		this.jugador = new Jugador(this, origen.x + x, origen.y + y);
		this.jugador.once('muerto', () => this.#alMorirElJugador());

		this.disparo = new Disparo(this, this.nivel.bloques);
		this.input.setDefaultCursor('crosshair');
		this.#crearColisiones();
		this.#entrarEnSala(inicio);

		// La interfaz es otra escena que se dibuja encima.
		this.scene.launch(ESCENAS.HUD, { jugador: this.jugador });
		this.events.once('shutdown', () => this.scene.stop(ESCENAS.HUD));
	}

	update() {
		if (this.jugadorMuerto) {
			return;
		}

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
		this.disparo.actualizar(
			this.nivel.limitesDeSala(this.salaActual.columna, this.salaActual.fila),
		);
	}

	#crearColisiones() {
		const { bloques, puertas } = this.nivel;

		// Debe ser un grupo de física (no `this.add.group()`): con un grupo normal Phaser entrega
		// los objetos de un choque en orden invertido (enemigo, bala) y el callback falla.
		// Solo tiene los enemigos de la sala donde está el jugador.
		this.enemigos = this.physics.add.group();

		this.physics.add.collider(this.jugador, bloques);
		this.physics.add.collider(this.jugador, puertas, (_jugador, puerta) =>
			this.#alTocarUnaPuerta(puerta),
		);
		this.physics.add.collider(this.enemigos, bloques);
		this.physics.add.collider(this.enemigos, puertas);
		this.physics.add.collider(this.enemigos, this.enemigos);
		this.physics.add.collider(this.jugador, this.enemigos, (_jugador, enemigo) =>
			this.jugador.recibirDano(enemigo.dano),
		);
		this.physics.add.collider(this.disparo.balas, puertas, (bala) => bala.desactivar());
		this.physics.add.overlap(this.disparo.balas, this.enemigos, (bala, enemigo) =>
			this.#alImpactarUnaBala(bala, enemigo),
		);
	}

	/** El estado de una sala (si ya empezó el combate, si está limpia…). Se crea al pedirlo. */
	#estadoDe(columna, fila) {
		const clave = `${columna},${fila}`;
		if (!this.estadoDeSalas.has(clave)) {
			this.estadoDeSalas.set(clave, {
				combateIniciado: false,
				limpia: false,
				enemigosVivos: 0,
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

		const origen = this.nivel.origenDeSala(columna, fila);
		for (const { x, y } of datos.enemigos) {
			const enemigo = new EnemigoDebil(this, origen.x + x, origen.y + y);
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

	#alMorirUnEnemigo(datos) {
		const estado = this.#estadoDe(datos.columna, datos.fila);
		estado.enemigosVivos -= 1;
		if (estado.enemigosVivos > 0) {
			return;
		}

		estado.limpia = true;
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

	// Muerte provisional: se reinicia el nivel. Qué pasa de verdad al morir (volver a la portada,
	// reiniciar el nivel, Revivir…) está por decidir; ver docs/decisiones-pendientes.md.
	#alMorirElJugador() {
		this.jugadorMuerto = true;
		this.physics.pause();
		this.#mostrarMensaje('Has muerto');
		this.time.delayedCall(1800, () => this.scene.restart());
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
