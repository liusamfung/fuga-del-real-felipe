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

// --- Los jefes (uno por nivel) ---
// El jefe del piso y su pelea (ver src/sistemas/PeleaConElJefe.js y docs/mecanicas.md, sección 6).
// Los valores son los acordados el 26/11/2026 y retocados el 27/11/2026; son provisionales y se ajustan jugando.
const JEFE_1 = Object.freeze({
	// Provisional: el dibujo del jefe del piso 1 todavía no existe, así que se usa el del segundo
	// (`jefe-2`) en la sala del centro. Se cambia aquí cuando haya uno por piso.
	CLAVE: 'jefe-2',
	ESCALA: 3, // los cuadros miden 32 x 32; ampliados ×3 son 96 x 96 px, más grandes que el jugador
	// El cuerpo de choque, en píxeles del dibujo (se amplía junto con él): el fantasma tiene aire a los lados.
	CUERPO_ANCHO: 22,
	CUERPO_ALTO: 26,

	VIDA: 60, // con la bala del jugador (1 de daño) son 60 aciertos; la granada quita 3. El 27/11/2026 se duplicó (era 30)
	// Ataque básico: un proyectil hacia el jugador. Se esquiva moviéndose (o con el dash).
	INTERVALO_DE_ATAQUE: 900, // ms entre un ataque básico y el siguiente (el 27/11/2026 bajó de 2000: más frecuente)
	PRIMER_ATAQUE: 1000, // ms desde que empieza la pelea hasta el primero
	PROYECTIL: Object.freeze({
		VELOCIDAD: 400, // px/s: casi el doble que el jugador (camina a 220); antes 190, que era muy lento
		DANO: 1, // corazones que quita
		MAX: 40, // proyectiles reservados; se reciclan (una ráfaga de 8 más un triple caben de sobra)
		LADO: 12, // tamaño del dibujo
	}),
	// Variantes del ataque básico (27/11/2026). Cada vez que toca un ataque básico se elige una al azar: el triple con
	// probabilidad fija y la ráfaga con una que SUBE a medida que el jefe pierde vida; si no, un proyectil solo.
	TRIPLE: Object.freeze({
		PROBABILIDAD: 0.35, // de cada ataque básico, ~1 de cada 3 es de tres proyectiles
		APERTURA: 22, // grados entre un proyectil y el siguiente: uno al jugador y uno a cada lado
	}),
	RAFAGA: Object.freeze({
		PROBABILIDAD_MAXIMA: 0.4, // con el jefe sin vida; con toda la vida es 0 y sube en línea recta
		DISPAROS_BASE: 4, // disparos de una ráfaga con toda la vida
		DISPAROS_EXTRA: 4, // los que se suman con el jefe sin vida: de 4 a 8
		ENTRE_DISPAROS: 110, // ms entre un disparo y el siguiente (cada uno apunta al jugador donde está)
	}),
	// Ataque fuerte: no se esquiva moviéndose; hay que responder un reto de inglés con el mundo en cámara lenta.
	UMBRALES: [0.75, 0.5, 0.25], // viene uno al bajar el jefe de estas fracciones de su vida
	NIVELES_DE_INGLES: [1, 2, 1], // el reto de cada ataque fuerte (jefe 1: alterna los niveles 1 y 2)
	AVISO: 800, // ms de aviso (destello y letrero) antes de que aparezca el reto
	// El golpe del ataque fuerte es un rayo verde que va del jefe hasta el final de la sala, en la dirección en que
	// estaba el jugador cuando apareció el reto. Si se falla, el rayo le cae sí o sí; si se acierta, el jugador hace
	// un dash automático hacia un lado y el rayo pasa de largo.
	RAYO: Object.freeze({
		ANCHO: 48, // px de ancho del rayo (el dash recorre unos 96, así que sacarlo del camino siempre alcanza)
		AVISO_ANCHO: 6, // px de la línea fina que avisa por dónde va a salir, mientras se responde el reto
		CRECE: 100, // ms que tarda en abrirse del todo
		DURACION: 500, // ms que se queda en pantalla con todo su ancho
		RETRASO_SI_ESQUIVA: 160, // ms que espera el rayo si el jugador acertó: así se ve que el dash sale primero (en cámara lenta el dash avanza menos)
	}),
	DANO_DEL_GOLPE: 2, // corazones que quita el rayo si se falla (le cae sí o sí, aunque se esté en inmunidad)
	RAPIDO: 0.5, // acertar con esta fracción del tiempo o más por delante devuelve el golpe al jefe
	DEVOLUCION: 0.1, // fracción de su vida máxima que pierde el jefe al devolverle el golpe
	PAUSA_TRAS_EL_ATAQUE_FUERTE: 1500, // ms de respiro antes del próximo ataque
	DANO_POR_TOCARLO: 1, // corazones que quita al jugador si lo toca
});

// El jefe del nivel 2 es un DUPLICADO del del nivel 1 (el fantasma, que se puso en el nivel 1 solo para probar):
// empieza con exactamente los mismos valores, pero es un objeto aparte para poder cambiarle lo que haga falta (más
// vida, otro ritmo, los niveles de inglés 2 y 3…) sin tocar al del nivel 1. Lo que cambie va después del `...`.
const JEFE_2 = Object.freeze({
	...JEFE_1,
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
			// ms que se ve el resultado (¡Bien!, ¡Te equivocaste!…) antes de cerrar la pantalla; el juego NO sigue hasta que
			// se cierra: sigue en cámara lenta. El 27/11/2026 bajó de 1100 a 450 (pedido: «0,5 s o menos»)
			TIEMPO_DEL_RESULTADO: 450,
			PANEL: Object.freeze({ Y: 50, ANCHO: 700, ALTO: 230, ANCHO_BARRA: 620 }),
		}),
	}),

	// Los mensajes en pantalla se dibujan por encima de todo, incluso de las balas.
	PROFUNDIDAD_MENSAJES: 2000,

	// El jefe del piso y su pelea (ver src/sistemas/PeleaConElJefe.js y docs/mecanicas.md, sección 6). Hay uno por
	// nivel: `JEFE` es el del nivel 1 y `JEFES` los trae todos por el número del nivel (ver más arriba).
	JEFE: JEFE_1,
	JEFES: Object.freeze({ 1: JEFE_1, 2: JEFE_2 }),

	// Las balas de los enemigos que disparan (los guardias del nivel 2). Lo que las distingue (velocidad, daño, dibujo)
	// está en el campo `disparo` de cada tipo (src/datos/enemigos.js).
	BALA_ENEMIGA: Object.freeze({
		MAX: 60, // balas reservadas en toda la escena; se reciclan
	}),

	// Lo que tienen en común todos los enemigos (el débil y las ratas): el tamaño del dibujo y del cuerpo.
	// Lo que los distingue (vida, velocidad, daño) está en src/datos/enemigos.js. Todos caminan en línea
	// recta hacia el jugador; si se les da otro comportamiento, ver docs/decisiones-pendientes.md.
	ENEMIGO: Object.freeze({
		ANCHO: 32, // tamaño del sprite
		ALTO: 48,
		// A diferencia del jugador, su cuerpo cubre casi todo el dibujo: a los enemigos se les apunta
		// al cuerpo o a la cabeza, y si el cuerpo fuera solo los pies las balas pasarían por encima.
		CUERPO_ANCHO: 24,
		CUERPO_ALTO: 40,
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

	// El nido de ratas: ocupa el lugar de una caja de cada sala. Mientras esté en pie, suelta ratas grises
	// cada cierto tiempo y la sala no se limpia: hay que romperlo a balazos (o con la granada). Provisional.
	NIDO: Object.freeze({
		ANCHO: 64, // igual que una caja
		ALTO: 64,
		VIDA: 10, // balas que aguanta (la granada le quita 3)
		TIPO: 'rata-gris', // qué rata suelta (una de src/datos/enemigos.js)
		INTERVALO: 4500, // ms entre una rata y la siguiente (la cámara lenta también lo estira)
		MAX_VIVAS: 6, // ratas suyas vivas a la vez: si ya hay tantas, espera
		DISTANCIA_AL_JUGADOR: 100, // px: no suelta una rata si el jugador está así de cerca de donde saldría
		DESTELLO: 80, // ms que se ve blanco al recibir un golpe
	}),

	// Cámara lenta: mientras se responde el reto de un poder, el mundo (enemigos, balas, animaciones y
	// temporizadores) va más lento, para que el objetivo no se haya ido cuando se acierta. Entra y sale
	// con una rampa suave. El tiempo del reto no se estira: se mide en tiempo real. Provisional.
	CAMARA_LENTA: Object.freeze({
		FACTOR: 0.2, // la velocidad del mundo en plena cámara lenta: 0,2 = una quinta parte
		ENTRADA: 120, // ms que tarda en bajar a ese factor
		SALIDA: 200, // ms que tarda en volver a la velocidad normal
	}),

	// Poderes especiales del jugador: cada uno se activa superando un reto de inglés. Valores iniciales
	// (provisionales): se ajustan jugando. Ver docs/mecanicas.md, sección 5.11.
	PODERES: Object.freeze({
		GRANADA: Object.freeze({
			NIVEL_DE_INGLES: 1, // el reto: 1 es el de traducción (el más fácil), ver NIVELES_DE_INGLES
			DANO: 3, // lo que le quita a cada enemigo alcanzado: mata a todos menos a la rata azul (5 de vida)
			RADIO: 96, // px: todo lo que quede a esta distancia del centro de la explosión recibe el daño
			VELOCIDAD: 420, // px/s: lo que tarda en volar hasta donde apuntaba el cursor
			VUELO_MINIMO: 150, // ms: lanzada a los pies también se ve volar un instante
			DURACION_DE_LA_EXPLOSION: 280, // ms que se ve la onda de la explosión
			// Recarga (ms) desde que TERMINA el reto: mayor si se acertó (se lanzó la granada).
			RECARGA_TRAS_ACIERTO: 6000,
			RECARGA_TRAS_FALLO: 2500,
		}),
	}),

	// Interfaz que se dibuja sobre la pared de arriba.
	HUD: Object.freeze({
		MARGEN: 48,
		Y: 16,
		SEPARACION_CORAZONES: 20,
		DASH_X: 372, // donde empiezan las cargas del dash, en el centro de la franja
		GRANADA_X: 482, // donde empieza el indicador de la granada, después del dash
	}),
});
