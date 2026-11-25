// Cómo suena cada letra cuando alguien deletrea en español, y cómo suele escribirlas el reconocedor
// de voz del navegador. Cada entrada dice qué letra(s) puede ser. Todo va en minúscula y sin tildes
// (la Ñ se conserva), igual que el texto ya normalizado en `src/utilidades/voz.js`.
//
// Es una tabla de DATOS a propósito: la prueba de voz (docs/prueba-de-voz.md) irá mostrando qué
// escribe el navegador de verdad, y aquí se agregan los nombres nuevos sin tocar el código.
//
// La B y la V suenan igual en español, así que "be" y "ve" son ambiguas: valen para las dos letras.
// Solo se distinguen si el jugador dice "be larga" o "ve corta" / "uve".

const AMBIGUA_B_V = Object.freeze(['B', 'V']);

export const NOMBRES_DE_LETRAS = Object.freeze({
	// Una sola letra posible
	a: ['A'],
	ah: ['A'],
	ce: ['C'],
	c: ['C'],
	se: ['C'], // el reconocedor suele oír "ce" como "se"
	de: ['D'],
	d: ['D'],
	e: ['E'],
	efe: ['F'],
	f: ['F'],
	ge: ['G'],
	je: ['G'], // la G se pronuncia "je"
	g: ['G'],
	hache: ['H'],
	ache: ['H'],
	h: ['H'],
	i: ['I'],
	y: ['I'], // el reconocedor escribe la "i" hablada como la palabra "y"
	jota: ['J'],
	j: ['J'],
	ka: ['K'],
	ca: ['K'],
	k: ['K'],
	ele: ['L'],
	el: ['L'],
	l: ['L'],
	eme: ['M'],
	m: ['M'],
	ene: ['N'],
	n: ['N'],
	eñe: ['Ñ'],
	enie: ['Ñ'],
	ñ: ['Ñ'],
	o: ['O'],
	pe: ['P'],
	p: ['P'],
	cu: ['Q'],
	ku: ['Q'],
	q: ['Q'],
	ere: ['R'],
	erre: ['R'],
	r: ['R'],
	ese: ['S'],
	es: ['S'],
	s: ['S'],
	te: ['T'],
	t: ['T'],
	u: ['U'],
	'doble ve': ['W'],
	'doble u': ['W'],
	'doble uve': ['W'],
	'uve doble': ['W'],
	'ove doble': ['W'],
	w: ['W'],
	equis: ['X'],
	ekis: ['X'],
	x: ['X'],
	'i griega': ['Y'],
	'y griega': ['Y'],
	ye: ['Y'],
	zeta: ['Z'],
	seta: ['Z'],
	zeda: ['Z'],
	z: ['Z'],

	// B y V
	be: AMBIGUA_B_V,
	ve: AMBIGUA_B_V,
	b: AMBIGUA_B_V,
	v: AMBIGUA_B_V,
	'be larga': ['B'],
	'be grande': ['B'],
	'be alta': ['B'],
	've corta': ['V'],
	've baja': ['V'],
	've chica': ['V'],
	uve: ['V'],
});

// Un nombre por letra, el más común: son las palabras hacia las que se inclina el reconocimiento
// (`ReconocedorDeVoz`, opción `sesgo`) para que oiga "ere" y no una palabra parecida.
export const NOMBRES_PARA_SESGAR = Object.freeze([
	'a',
	'be',
	'ce',
	'de',
	'e',
	'efe',
	'ge',
	'hache',
	'i',
	'jota',
	'ka',
	'ele',
	'eme',
	'ene',
	'eñe',
	'o',
	'pe',
	'cu',
	'ere',
	'ese',
	'te',
	'u',
	'uve',
	'doble ve',
	'equis',
	'i griega',
	'zeta',
]);

/** El máximo de palabras que tiene un nombre de letra (por ejemplo, "doble ve" tiene 2). */
export const MAX_PALABRAS_POR_NOMBRE = Math.max(
	...Object.keys(NOMBRES_DE_LETRAS).map((nombre) => nombre.split(' ').length),
);
