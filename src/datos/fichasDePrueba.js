// Fichas de la prueba de voz en inglés (`?ingles`, docs/prueba-de-voz-ingles.md). No son el banco
// del juego: son 10 fichas fáciles para medir si el navegador entiende a quien dice una palabra en
// inglés. Las respuestas son palabras comunes que cualquiera de la clase sabe, así se mide el
// reconocimiento y no el vocabulario.
//
//   tipo       'traduccion': se ve una palabra en español y se dice su traducción al inglés.
//              'definicion': se ve la definición en inglés y se dice la palabra.
//   enunciado  lo que se ve en pantalla.
//   opciones   las tres palabras en inglés; se dice una de ellas.
//   correcta   posición (desde 0) de la respuesta correcta en `opciones`.
//
// Las tres opciones de cada ficha deben ser completamente distintas (ver `opcionesDistintas` en
// src/utilidades/opciones.js; hay una prueba que lo comprueba). El enunciado tampoco puede parecerse
// a ninguna opción (si la definición dijera "teaches", se acertaría "teacher" leyendo la pantalla).
// Las definiciones están escritas con palabras propias, sin copiar de ningún diccionario.

export const FICHAS_DE_PRUEBA = Object.freeze([
	{ tipo: 'traduccion', enunciado: 'casa', opciones: ['water', 'house', 'tired'], correcta: 1 },
	{ tipo: 'traduccion', enunciado: 'perro', opciones: ['dog', 'book', 'green'], correcta: 0 },
	{
		tipo: 'traduccion',
		enunciado: 'ventana',
		opciones: ['cheese', 'summer', 'window'],
		correcta: 2,
	},
	{ tipo: 'traduccion', enunciado: 'hermana', opciones: ['rain', 'sister', 'yellow'], correcta: 1 },
	{ tipo: 'traduccion', enunciado: 'dinero', opciones: ['garden', 'cold', 'money'], correcta: 2 },
	{
		tipo: 'definicion',
		enunciado: 'a situation in which someone could be hurt or harmed',
		opciones: ['danger', 'party', 'river'],
		correcta: 0,
	},
	{
		tipo: 'definicion',
		enunciado: 'a person whose job is to help students learn',
		opciones: ['doctor', 'farmer', 'teacher'],
		correcta: 2,
	},
	{
		tipo: 'definicion',
		enunciado: 'the first meal of the day',
		opciones: ['holiday', 'breakfast', 'mountain'],
		correcta: 1,
	},
	{
		tipo: 'definicion',
		enunciado: 'to move fast using your legs',
		opciones: ['sleep', 'write', 'run'],
		correcta: 2,
	},
	{
		tipo: 'definicion',
		enunciado: 'the huge blue area that covers most of our planet',
		opciones: ['pencil', 'ocean', 'winter'],
		correcta: 1,
	},
]);
