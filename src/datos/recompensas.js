// Recompensas de los cofres. Cada mejora dice qué estadística del jugador sube y cuánto.
// Para agregar una mejora nueva basta con agregar una línea aquí.
//
// Estadísticas del jugador: vidaMaxima, ataque, velocidad (ver `Jugador.estadisticas`).
// Los valores se ajustan probando el juego.

export const MEJORAS_COMUNES = Object.freeze({
	vida: { texto: '+1 corazón', estadistica: 'vidaMaxima', cantidad: 1 },
	ataque: { texto: '+0.5 de ataque', estadistica: 'ataque', cantidad: 0.5 },
	velocidad: { texto: '+30 de velocidad', estadistica: 'velocidad', cantidad: 30 },
});
