// Configuración: todos los valores del juego en un solo lugar.
// Los números salen del documento de diseño (docs/diseno-del-juego.md).
// Los tiempos están en milisegundos (ms).

export const ESCENAS = Object.freeze({
	ARRANQUE: 'EscenaArranque',
});

export const CONFIG = Object.freeze({
	// Resolución interna provisional. Se define de verdad cuando el equipo
	// pruebe el estilo de dibujo y decida el tamaño del píxel.
	ANCHO: 480,
	ALTO: 270,

	// Eventos de reacción ("!") — sección 6 del diseño
	QTE: Object.freeze({
		RETARDO_SIGNO_MIN: 100, // el audio suena y, entre 100 y 200 ms después, aparece el "!"
		RETARDO_SIGNO_MAX: 200,
		ESCALA_TIEMPO: 0.2, // cámara lenta del mundo
		RAMPA_ENTRADA: 125, // entrada suave a la cámara lenta (100–150 ms)
		RAMPA_SALIDA: 200, // vuelta a velocidad normal tras acertar
		TIEMPO_NIVEL_1: 3000,
		TIEMPO_NIVEL_2: 2000,
		BONO_VOZ: 1.5, // el modo voz tiene +50 % de tiempo
	}),
});
