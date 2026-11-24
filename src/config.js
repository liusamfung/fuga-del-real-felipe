// Configuración: todos los valores del juego en un solo lugar.
// Las medidas salen del diseño (docs/diseno-del-juego.md y docs/guia-de-recursos.md).
// Las medidas están en píxeles (px) y las velocidades en píxeles por segundo (px/s).

export const ESCENAS = Object.freeze({
	ARRANQUE: 'EscenaArranque',
	JUEGO: 'EscenaJuego',
});

export const CONFIG = Object.freeze({
	// La pantalla muestra una sala completa a la vez.
	ANCHO: 800,
	ALTO: 640,

	SALA: Object.freeze({
		ANCHO: 800,
		ALTO: 640,
		CASILLA: 32, // tamaño de una casilla; también es el grosor de las paredes
	}),

	JUGADOR: Object.freeze({
		ANCHO: 32, // tamaño del sprite
		ALTO: 48,
		// El cuerpo de choque es más pequeño que el sprite y está en los pies:
		// así el jugador puede pasar "por detrás" de los objetos, como en The Binding of Isaac.
		CUERPO_ANCHO: 24,
		CUERPO_ALTO: 20,
		VELOCIDAD: 220,
	}),

	DISPARO: Object.freeze({
		CADENCIA: 250, // ms mínimos entre un disparo y el siguiente
		VELOCIDAD_BALA: 520,
		DANO: 1,
		MAX_BALAS: 30, // balas reservadas; se reciclan, nunca se crean más
		PROFUNDIDAD_BALAS: 1000, // las balas se dibujan por encima de todo lo demás
	}),
});
