// Configuración: todos los valores del juego en un solo lugar.
// Las medidas salen del diseño (docs/diseno-del-juego.md y docs/guia-de-recursos.md).
// Las medidas están en píxeles (px), las velocidades en píxeles por segundo (px/s)
// y los tiempos en milisegundos (ms).

export const ESCENAS = Object.freeze({
	ARRANQUE: 'EscenaArranque',
	JUEGO: 'EscenaJuego',
	HUD: 'EscenaHUD',
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
		// Estadísticas con las que empieza (los cofres las mejoran).
		VIDA_INICIAL: 3, // cada punto de vida es un corazón
		ATAQUE_INICIAL: 1, // daño de cada bala
		VELOCIDAD: 220,
		INMUNIDAD: 1000, // ms sin recibir daño después de un golpe
	}),

	// Los mensajes en pantalla se dibujan por encima de todo, incluso de las balas.
	PROFUNDIDAD_MENSAJES: 2000,

	// Enemigo débil de las salas de alrededor. Su comportamiento (por ahora solo camina hacia
	// el jugador) está por definir; ver docs/decisiones-pendientes.md.
	ENEMIGO_DEBIL: Object.freeze({
		ANCHO: 32,
		ALTO: 32,
		CUERPO_ANCHO: 24,
		CUERPO_ALTO: 20,
		VIDA: 3,
		VELOCIDAD: 70,
		DANO: 1, // daño al jugador al tocarlo
		DESTELLO: 80, // ms que se ve blanco al recibir un golpe
	}),

	COFRE: Object.freeze({
		ANCHO: 32,
		ALTO: 32,
	}),

	DISPARO: Object.freeze({
		CADENCIA: 250, // ms mínimos entre un disparo y el siguiente
		VELOCIDAD_BALA: 520,
		MAX_BALAS: 30, // balas reservadas; se reciclan, nunca se crean más
		PROFUNDIDAD_BALAS: 1000, // las balas se dibujan por encima de todo lo demás
	}),

	// Interfaz que se dibuja sobre la pared de arriba.
	HUD: Object.freeze({
		MARGEN: 48,
		Y: 16,
		SEPARACION_CORAZONES: 20,
	}),
});
