import { CONFIG } from '../config.js';
import { FOTOGRAMAS_TILESET } from '../datos/recursos.js';
import { Nido } from '../entidades/Nido.js';
import { Puerta } from '../entidades/Puerta.js';
import { buscarSala } from './GeneradorDeNivel.js';
import { rectanguloDePuerta, segmentosDeParedes } from '../utilidades/paredes.js';

const { ANCHO, ALTO, CASILLA, ANCHO_PUERTA, MARGEN_DE_ENTRADA } = CONFIG.SALA;
const MEDIDAS_DE_SALA = { ancho: ANCHO, alto: ALTO, grosor: CASILLA, anchoPuerta: ANCHO_PUERTA };

// El nivel dentro del juego: construye el suelo, las paredes, los obstáculos y las puertas de
// todas las salas (a partir del modelo que arma `generarNivel`) y guarda dónde está cada cosa.
//
// Las salas están una al lado de otra en el mundo: la sala (columna, fila) empieza en el punto
// (columna × 800, fila × 640). La cámara muestra una sala a la vez.
export class Nivel {
	constructor(escena, modelo) {
		this.escena = escena;
		this.modelo = modelo;
		this.bloques = escena.physics.add.staticGroup(); // paredes y obstáculos
		this.puertas = escena.physics.add.staticGroup();
		this.puertasPorSala = new Map(); // 'columna,fila' -> lista de puertas de esa sala
		this.nidos = escena.physics.add.staticGroup(); // los nidos de ratas (ver entidades/Nido.js)
		this.nidoPorSala = new Map(); // 'columna,fila' -> el nido de esa sala

		for (const sala of modelo.salas) {
			this.#construirSala(sala);
		}
	}

	/** El punto del mundo donde empieza la sala (su esquina de arriba a la izquierda). */
	origenDeSala(columna, fila) {
		return { x: columna * ANCHO, y: fila * ALTO };
	}

	/** El rectángulo del mundo que ocupa la sala. */
	limitesDeSala(columna, fila) {
		const { x, y } = this.origenDeSala(columna, fila);
		return { x, y, ancho: ANCHO, alto: ALTO };
	}

	/** La sala (columna y fila) que contiene el punto (x, y) del mundo. */
	salaEn(x, y) {
		return { columna: Math.floor(x / ANCHO), fila: Math.floor(y / ALTO) };
	}

	/** El nido de ratas de la sala, o undefined si no tiene o ya se rompió. */
	nidoDe(columna, fila) {
		const nido = this.nidoPorSala.get(`${columna},${fila}`);
		return nido?.active ? nido : undefined;
	}

	/** Los datos de la sala (enemigos, cofre, puertas…), o undefined si no existe. */
	buscarSala(columna, fila) {
		return buscarSala(this.modelo, columna, fila);
	}

	/**
	 * Verdadero si el punto está bien adentro de la sala: pasada la pared y el hueco de las puertas.
	 * Así el combate empieza (y las puertas se cierran) cuando el jugador ya no puede quedar atrapado.
	 */
	estaAdentro(x, y, columna, fila) {
		const origen = this.origenDeSala(columna, fila);
		return (
			x >= origen.x + MARGEN_DE_ENTRADA &&
			x <= origen.x + ANCHO - MARGEN_DE_ENTRADA &&
			y >= origen.y + MARGEN_DE_ENTRADA &&
			y <= origen.y + ALTO - MARGEN_DE_ENTRADA
		);
	}

	/** Cierra las puertas de la sala. Las que están con llave ya estaban cerradas. */
	cerrarPuertas(columna, fila) {
		for (const puerta of this.#puertasDe(columna, fila)) {
			puerta.cerrar();
		}
	}

	/** Abre las puertas de la sala, menos las que necesitan la llave. */
	abrirPuertas(columna, fila) {
		for (const puerta of this.#puertasDe(columna, fila)) {
			if (!puerta.bloqueadaPorLlave) {
				puerta.abrir();
			}
		}
	}

	/** Abre para siempre todas las puertas con llave: las que entran y las que salen del jefe. */
	desbloquearSalaDelJefe() {
		for (const puertas of this.puertasPorSala.values()) {
			for (const puerta of puertas) {
				if (puerta.bloqueadaPorLlave) {
					puerta.desbloquear();
				}
			}
		}
	}

	#puertasDe(columna, fila) {
		return this.puertasPorSala.get(`${columna},${fila}`) ?? [];
	}

	#construirSala(sala) {
		const origen = this.origenDeSala(sala.columna, sala.fila);
		const { escena } = this;

		escena.add
			.tileSprite(origen.x, origen.y, ANCHO, ALTO, 'tileset', FOTOGRAMAS_TILESET.sueloRayas)
			.setOrigin(0, 0)
			.setDepth(-1);

		const lados = sala.puertas.map((puerta) => puerta.lado);
		for (const { x, y, ancho, alto } of segmentosDeParedes(MEDIDAS_DE_SALA, lados)) {
			const pared = escena.add
				.tileSprite(
					origen.x + x,
					origen.y + y,
					ancho,
					alto,
					'tileset',
					FOTOGRAMAS_TILESET.texturaRayasMarron,
				)
				.setOrigin(0, 0);
			pared.setDepth(origen.y + y + alto);
			this.bloques.add(pared);
		}

		for (const { x, y, ancho, alto } of sala.obstaculos) {
			const caja = escena.add
				.tileSprite(origen.x + x, origen.y + y, ancho, alto, 'caja')
				.setOrigin(0, 0);
			caja.setDepth(origen.y + y + alto);
			this.bloques.add(caja);
		}

		if (sala.nido) {
			const { x, y, ancho, alto } = sala.nido;
			const nido = new Nido(escena, origen.x + x + ancho / 2, origen.y + y + alto / 2);
			nido.sala = { columna: sala.columna, fila: sala.fila };
			this.nidos.add(nido); // el grupo estático le da su cuerpo
			this.nidoPorSala.set(`${sala.columna},${sala.fila}`, nido);
		}

		const puertas = [];
		for (const { lado, bloqueadaPorLlave } of sala.puertas) {
			const hueco = rectanguloDePuerta(lado, MEDIDAS_DE_SALA);
			const puerta = new Puerta(
				escena,
				origen.x + hueco.x + hueco.ancho / 2,
				origen.y + hueco.y + hueco.alto / 2,
				lado,
				bloqueadaPorLlave,
			);
			puerta.setDepth(origen.y + hueco.y + hueco.alto);
			this.puertas.add(puerta); // el grupo estático le da su cuerpo
			if (bloqueadaPorLlave) {
				puerta.cerrar();
			} else {
				puerta.abrir();
			}
			puertas.push(puerta);
		}
		this.puertasPorSala.set(`${sala.columna},${sala.fila}`, puertas);
	}
}
