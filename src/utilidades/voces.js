// Elegir la voz del navegador con la que habla el juego. Es una función pura: recibe la lista de voces
// (`speechSynthesis.getVoices()`) y no usa el navegador, así que se prueba con `npm test`.

// Android escribe 'en_US' y los demás 'en-US'; se comparan sin mayúsculas y con guion.
const normalizarIdioma = (idioma) => (idioma ?? '').replace('_', '-').toLowerCase();

/**
 * La mejor voz para un idioma ('en-US'), o null si no hay ninguna de ese idioma.
 * Prefiere una voz exactamente del mismo idioma (en-US antes que en-GB); si no la hay, una del mismo
 * idioma base ('en'). Entre varias, la que el sistema marca como predeterminada, y si no, la primera.
 */
export function elegirVoz(voces, idioma) {
	const buscado = normalizarIdioma(idioma);
	const base = buscado.split('-')[0];

	const exactas = voces.filter((voz) => normalizarIdioma(voz.lang) === buscado);
	const delIdioma =
		exactas.length > 0
			? exactas
			: voces.filter((voz) => normalizarIdioma(voz.lang).split('-')[0] === base);

	return delIdioma.find((voz) => voz.default) ?? delIdioma[0] ?? null;
}
