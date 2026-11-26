// Configuración: todos los valores del juego en un solo lugar.
// Las medidas salen del diseño (docs/diseno-del-juego.md y docs/guia-de-recursos.md).
// Las medidas están en píxeles (px), las velocidades en píxeles por segundo (px/s)
// y los tiempos en milisegundos (ms).

export const ESCENAS = Object.freeze({
	ARRANQUE: 'EscenaArranque',
	JUEGO: 'EscenaJuego',
	HUD: 'EscenaHUD',
	DELETREO: 'EscenaDeletreo',
	PRUEBA_VOZ: 'EscenaPruebaVoz',
	PRUEBA_INGLES: 'EscenaPruebaIngles',
	OPCIONES: 'EscenaOpciones',
});

// Cómo se muestra la palabra que hay que deletrear (de menos a más difícil).
//   visible  la palabra se ve todo el tiempo
//   huecos   se ve una sola vez; luego solo quedan los huecos, como en el Ahorcado
//            (las letras que se aciertan van apareciendo)
//   memoria  se ve una sola vez; luego no queda nada en pantalla: hay que recordarla
//   dictado  nunca se ve: una voz (la del navegador) dice la palabra en inglés y el jugador la escribe;
//            solo se ven los huecos y las letras que va acertando (nivel 3 de los retos de inglés)
export const MODOS_DE_DELETREO = Object.freeze({
	VISIBLE: 'visible',
	HUECOS: 'huecos',
	MEMORIA: 'memoria',
	DICTADO: 'dictado',
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
		// Tiempo (ms) que se ve la palabra antes de esconderla, en los modos huecos y memoria: BASE
		// más POR_LETRA por cada letra. Es lo justo para leerla UNA vez; durante la lectura no corre
		// el tiempo de deletrear ni se aceptan letras.
		LECTURA: Object.freeze({ BASE: 800, POR_LETRA: 120 }),
		FACTOR_INVERTIDA: 1.5, // al revés se da 1,5 veces el tiempo
		// Deletrear con la voz (Web Speech API del navegador). Valores iniciales: salen de la prueba de
		// voz (docs/prueba-de-voz.md) y se ajustan con ella.
		VOZ: Object.freeze({
			IDIOMA: 'es-PE', // o 'es-ES'; ver docs/decisiones-pendientes.md
			FACTOR_DE_TIEMPO: 2, // la voz es más lenta que el teclado (con pausas, 0,7–0,85 s por letra): el doble
			// Guardar la última letra de un resultado provisional hasta que el navegador la confirme.
			// Apagado: en la prueba de voz retenerla costaba ~1,3 s por palabra y casi no evitaba errores.
			RETENER_ULTIMA: false,
			// Dos ayudas contra el reconocedor que junta las letras en palabras. Se prueban con `?voz`
			// (teclas P y L) y se activan aquí si ayudan. Ver docs/prueba-de-voz.md. El sesgo solo
			// funciona junto con PROCESAR_EN_EL_EQUIPO: con el servidor, Chrome lo rechaza.
			SESGAR_A_LAS_LETRAS: false, // inclinar el reconocimiento hacia los nombres de las letras
			IMPULSO_DEL_SESGO: 5, // de 0 a 10: cuánto se inclina
			PROCESAR_EN_EL_EQUIPO: false, // reconocer sin servidor (hay que descargar el idioma)
		}),
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

	// Retos de inglés: decir en voz alta la opción correcta (Web Speech API). Valores iniciales: salen
	// de la prueba de voz en inglés (docs/prueba-de-voz-ingles.md) y se ajustan con ella.
	INGLES: Object.freeze({
		IDIOMA: 'en-US', // inglés americano
		LETRAS_POR_ERROR: 3, // se perdona una edición por cada 3 letras de la opción (mínimo una)
		VELOCIDAD_DE_LA_VOZ: 0.9, // la voz del juego habla un poco más despacio (1 es lo normal)
		NO_REPETIR: 10, // cuántas de las últimas palabras no se vuelven a pedir
		// Nivel 3: el juego dice la palabra y el jugador la escribe. Valores iniciales: se ajustan jugando.
		DICTADO: Object.freeze({
			// ms que se da para oír la palabra la primera vez; durante ese tiempo no corre la barra.
			ESCUCHA: 1500,
			// Multiplica el tiempo del teclado (DELETREO.TECLADO): hay que oír, recordar y escribir.
			// Repetir la palabra (ESPACIO) no detiene la barra: cada repetición cuesta tiempo.
			FACTOR_DE_TIEMPO: 2,
		}),
		// Niveles 1 y 2: se ve una ficha (una palabra en español o una definición en inglés) y se dice la
		// opción correcta entre tres. Valores iniciales: se ajustan jugando.
		OPCIONES: Object.freeze({
			// Tiempo (ms) para responder: BASE más POR_PALABRA por cada palabra del enunciado (hay que leerlo).
			// En la prueba de voz en inglés las respuestas rápidas tardaron ~2,4 s y las lentas 7–9 s.
			BASE: 6000,
			POR_PALABRA: 500,
			TIEMPO_DEL_RESULTADO: 1100, // ms que se ve el resultado antes de cerrar la pantalla
			PANEL: Object.freeze({ Y: 50, ANCHO: 700, ALTO: 230, ANCHO_BARRA: 620 }),
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
