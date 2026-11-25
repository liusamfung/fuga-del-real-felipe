import { elegirAlAzar } from '../utilidades/azar.js';

// Arma un nivel a partir de su descripción (src/datos/niveles.js). Es lógica pura, sin Phaser,
// para poder probarla con `npm test`.
//
// Hace dos cosas:
//   1. Calcula las puertas: cada sala se conecta con sus vecinas de arriba, abajo, izquierda y
//      derecha. Las 8 salas de alrededor forman un anillo; las puertas que dan a la sala del jefe
//      (la del centro) están cerradas con llave.
//   2. Sortea en cuál de las 8 salas de alrededor está la llave. Se sortea al crear el nivel, no
//      cada vez que se abre un cofre: así cada cofre tiene 1/8 de probabilidad y, a la vez, la llave
//      siempre existe. Si se tirara un dado en cada cofre, podría no salir nunca.

// Hacia dónde está cada vecina: [lado, cambio de columna, cambio de fila].
const VECINAS = Object.freeze([
	['arriba', 0, -1],
	['derecha', 1, 0],
	['abajo', 0, 1],
	['izquierda', -1, 0],
]);

export function generarNivel(descripcion, azar = Math.random) {
	const { columnas, filas, salaDelJefe } = descripcion;
	const esElJefe = (columna, fila) => columna === salaDelJefe.columna && fila === salaDelJefe.fila;
	const salas = [];

	for (let fila = 0; fila < filas; fila += 1) {
		for (let columna = 0; columna < columnas; columna += 1) {
			salas.push(armarSala(descripcion, columna, fila, esElJefe));
		}
	}

	const conCofre = salas.filter((sala) => sala.cofre !== null);
	const conLlave = elegirAlAzar(conCofre, azar);
	conLlave.cofre.conLlave = true;

	return {
		nombre: descripcion.nombre,
		columnas,
		filas,
		salaInicial: descripcion.salaInicial,
		salaDelJefe,
		posicionInicialDelJugador: descripcion.posicionInicialDelJugador,
		salas,
		salaConLlave: { columna: conLlave.columna, fila: conLlave.fila },
	};
}

/** La sala de ese lugar del nivel, o undefined si no existe. */
export function buscarSala(nivel, columna, fila) {
	return nivel.salas.find((sala) => sala.columna === columna && sala.fila === fila);
}

function armarSala(descripcion, columna, fila, esElJefe) {
	const { columnas, filas, salaInicial, posicionDelCofre } = descripcion;
	const puertas = [];

	for (const [lado, cambioDeColumna, cambioDeFila] of VECINAS) {
		const vecinaColumna = columna + cambioDeColumna;
		const vecinaFila = fila + cambioDeFila;
		if (vecinaColumna < 0 || vecinaColumna >= columnas || vecinaFila < 0 || vecinaFila >= filas) {
			continue;
		}
		puertas.push({
			lado,
			hacia: { columna: vecinaColumna, fila: vecinaFila },
			// Cualquier puerta que toque la sala del jefe se abre con la llave.
			bloqueadaPorLlave: esElJefe(columna, fila) || esElJefe(vecinaColumna, vecinaFila),
		});
	}

	if (esElJefe(columna, fila)) {
		return { columna, fila, tipo: 'jefe', obstaculos: [], enemigos: [], cofre: null, puertas };
	}

	const datos = descripcion.salas.find((sala) => sala.columna === columna && sala.fila === fila);
	if (!datos) {
		throw new Error(`Falta describir la sala ${columna},${fila} del nivel "${descripcion.nombre}"`);
	}

	return {
		columna,
		fila,
		tipo: 'combate',
		esInicial: columna === salaInicial.columna && fila === salaInicial.fila,
		obstaculos: datos.obstaculos,
		enemigos: [datos.enemigo],
		cofre: { ...posicionDelCofre, conLlave: false },
		puertas,
	};
}
