// Configuración: todos los valores del juego en un solo lugar.
// Las medidas salen del diseño (docs/diseno-del-juego.md y docs/guia-de-recursos.md).
// Las medidas están en píxeles (px), las velocidades en píxeles por segundo (px/s)
// y los tiempos en milisegundos (ms).

export const ESCENAS = Object.freeze({
	ARRANQUE: 'EscenaArranque',
	JUEGO: 'EscenaJuego',
	HUD: 'EscenaHUD',
	DELETREO: 'EscenaDeletreo',
});

export const CONFIG = Object.freeze({
	// La pantalla muestra una sala completa a la vez.
	ANCHO: 800,
	ALTO: 640,

	SALA: Object.freeze({
		ANCHO: 800,
		ALTO: 640,
		CASILLA: 32, // tamaño de una casilla; también es el grosor de las paredes
		ANCHO_PUERTA: 96, // hueco de cada puerta, centrado en la pared
		// Distancia al borde de la sala que el jugador debe pasar para que empiece el combate y se
		// cierren las puertas. Es mayor que el grosor de la pared para no atraparlo en el hueco.
		MARGEN_DE_ENTRADA: 48,
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

	// El dash: un impulso corto del jugador, con recarga. Valores iniciales, se ajustan jugando.
	DASH: Object.freeze({
		VELOCIDAD: 640, // px/s durante el impulso: en 150 ms avanza unos 100 px (3 casillas)
		DURACION: 150, // ms que dura el impulso
		RECARGA: 1200, // ms desde el primer uso hasta recuperar todas las cargas
		INMUNIDAD: 200, // ms sin recibir daño desde que empieza (un poco más que el impulso)
		CARGAS_INICIALES: 1, // con DobleDash son 2
		INTERVALO_DE_ESTELA: 40, // ms entre una imagen de la estela y la siguiente
	}),

	// Deletrear palabras (hoy con el teclado; luego con la voz). Valores iniciales, se ajustan jugando.
	DELETREO: Object.freeze({
		// Tiempo (ms) para deletrear con el teclado: BASE más POR_LETRA por cada letra. La voz tendrá
		// más tiempo (docs/mecanicas.md, sección 5).
		TECLADO: Object.freeze({ BASE: 1500, POR_LETRA: 400 }),
		FACTOR_INVERTIDA: 1.5, // al revés se da 1,5 veces el tiempo
		ERRORES_PERMITIDOS: 2, // letras equivocadas que se perdonan; una más y se falla
		TIEMPO_DEL_RESULTADO: 900, // ms que se ve el resultado antes de cerrar la pantalla
		DESTELLO_DE_ERROR: 150, // ms que el marco se pone rojo al equivocarse
		PANEL: Object.freeze({
			Y: 170,
			ANCHO: 640,
			ALTO: 150,
			ANCHO_BARRA: 520,
			SEPARACION_LETRAS: 36,
		}),
	}),

	// Los mensajes en pantalla se dibujan por encima de todo, incluso de las balas.
	PROFUNDIDAD_MENSAJES: 2000,

	// Enemigo débil de las salas de alrededor. Su comportamiento (por ahora solo camina hacia
	// el jugador) está por definir; ver docs/decisiones-pendientes.md.
	ENEMIGO_DEBIL: Object.freeze({
		ANCHO: 32, // tamaño del sprite
		ALTO: 48,
		// A diferencia del jugador, su cuerpo cubre casi todo el dibujo: a los enemigos se les apunta
		// al cuerpo o a la cabeza, y si el cuerpo fuera solo los pies las balas pasarían por encima.
		CUERPO_ANCHO: 24,
		CUERPO_ALTO: 40,
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
		DASH_X: 372, // donde empiezan las cargas del dash, en el centro de la franja
	}),
});
