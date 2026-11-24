import { MEJORAS_COMUNES } from '../datos/recompensas.js';
import { elegirAlAzar } from '../utilidades/azar.js';

// Elige y aplica las mejoras de los cofres (los valores están en src/datos/recompensas.js).

/** Elige la clave de una mejora común al azar, por ejemplo 'vida', 'ataque' o 'velocidad'. */
export function elegirMejoraComun(azar = Math.random) {
	return elegirAlAzar(Object.keys(MEJORAS_COMUNES), azar);
}

/** Aplica la mejora al jugador y devuelve el texto para mostrar en pantalla. */
export function aplicarMejora(jugador, clave) {
	const { texto, estadistica, cantidad } = MEJORAS_COMUNES[clave];
	jugador.mejorar(estadistica, cantidad);
	return texto;
}
