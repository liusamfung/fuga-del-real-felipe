// Los textos de la portada: el nombre del juego, quiénes lo hicieron y qué pulsar para empezar. Son solo datos (sin lógica):
// para cambiar un nombre o un rol basta con editar este archivo. La pantalla que los muestra es `EscenaPortada`
// (src/escenas/EscenaPortada.js).

export const TITULO_DEL_JUEGO = Object.freeze(['FUGA DEL', 'REAL FELIPE']);
export const SUBTITULO_DEL_JUEGO = 'Sitio del Callao, 1824-1826';

// Quién hizo qué. Cada grupo lleva su rol y los nombres de quienes lo hicieron, en el orden en que se muestran.
export const CREDITOS = Object.freeze([
	Object.freeze({ rol: 'Programación y lógica', nombres: Object.freeze(['Liu Fung']) }),
	Object.freeze({
		rol: 'Sprites y diseño visual',
		nombres: Object.freeze(['Sebastián', 'Carlo Flores', 'Jorge Vega']),
	}),
]);

export const TEXTO_PARA_COMENZAR = 'Pulsa ENTER para comenzar';
