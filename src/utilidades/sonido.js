// Cuentas del sonido que no necesitan el navegador: se prueban con `npm test`.

/**
 * ¿Ya puede volver a sonar un efecto? Es falso si sonó hace menos de `separacion` ms. `ultimaVez` es el instante de la
 * última vez (o `undefined` si nunca sonó). Con `separacion` 0 siempre puede.
 */
export function puedeSonar(ultimaVez, ahora, separacion) {
	return ultimaVez === undefined || ahora - ultimaVez >= separacion;
}

/** Un cambio de tono al azar entre `-centesimas` y `+centesimas` (100 centésimas = un semitono). `azar` da de 0 a 1. */
export function variacionDeTono(azar, centesimas) {
	// `+ 0` para que un 0 no salga como -0.
	return Math.round((azar() * 2 - 1) * centesimas) + 0;
}

/**
 * A qué ritmo suena la música según la velocidad del mundo: con el mundo normal (`escala` 1) suena normal y en plena
 * cámara lenta (`escala` = `factor`) baja a `minimo`, como una cinta que se frena. En medio, en línea recta.
 * Nunca sale del rango entre `minimo` y 1.
 */
export function ritmoDeLaMusica(escala, { factor, minimo }) {
	const avance = Math.min(1, Math.max(0, (escala - factor) / (1 - factor)));
	return minimo + (1 - minimo) * avance;
}

/**
 * Acerca el volumen `actual` a `objetivo` según el tiempo que pasó (`dt`, en ms): un cambio completo de 0 a 1 tarda
 * `duracion` ms. Así el volumen baja y sube suave, sin cortes, y nunca se pasa del objetivo. Con `duracion` 0 salta.
 */
export function acercarElVolumen(actual, objetivo, dt, duracion) {
	if (duracion <= 0) {
		return objetivo;
	}

	const paso = dt / duracion;
	return actual < objetivo ? Math.min(objetivo, actual + paso) : Math.max(objetivo, actual - paso);
}
