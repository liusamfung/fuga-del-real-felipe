// Recompensas de los cofres. Cada mejora dice qué estadística del jugador sube y cuánto.
// Para agregar una mejora nueva basta con agregar una línea aquí.
//
// Estadísticas del jugador: vidaExtra, ataque, velocidad (ver `Jugador.estadisticas`).
// Los valores se ajustan probando el juego.
//
// La vida del jugador son siempre 3 corazones (`vidaMaxima`). El cofre de vida NO sube ese máximo: da un corazón EXTRA
// (`vidaExtra`), temporal: absorbe el daño primero y desaparece al recibirlo (ver src/utilidades/vida.js).

export const MEJORAS_COMUNES = Object.freeze({
	vida: { texto: '+1 corazón temporal', estadistica: 'vidaExtra', cantidad: 1 },
	ataque: { texto: '+0.5 de ataque', estadistica: 'ataque', cantidad: 0.5 },
	velocidad: { texto: '+30 de velocidad', estadistica: 'velocidad', cantidad: 30 },
});
