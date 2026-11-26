# Banco de vocabulario en inglés

Las palabras de los retos de inglés ([cambio de enfoque](decisiones-pendientes.md)) viven en
[`src/datos/vocabulario.js`](../src/datos/vocabulario.js). Hoy hay **60 palabras**: 30 del libro 1 y
30 del libro 2.

## De dónde salen

La lista de palabras sale del mazo de Anki **«4000 Essential English Words»** del equipo, que está
dividido en 6 libros por nivel (el libro 1 es el más fácil). **De ese mazo solo se tomó la palabra y el
número de libro.** Las traducciones y las definiciones son propias (el mazo trae definiciones, frases,
audios e imágenes, pero no se copian). Los audios e imágenes del mazo **no se suben al repositorio**.

## Qué lleva cada palabra

| Campo        | Qué es                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------ |
| `palabra`    | La palabra en inglés, en minúsculas y sin espacios. Es la respuesta (y lo que se escribe). |
| `libro`      | 1 o 2: el libro del mazo. Sirve como pista de dificultad.                                  |
| `categoria`  | De qué trata (`animal`, `cuerpo`, `comida`…). Evita que aparezcan juntas dos respuestas.   |
| `traduccion` | La palabra en español, **una sola**. Es lo que se ve en el nivel 1.                        |
| `definicion` | La definición en inglés sencillo, con palabras propias. Es lo que se ve en el nivel 2.     |

## Cómo se arma una ficha

`armarFicha` (en [`src/utilidades/fichas.js`](../src/utilidades/fichas.js)) toma una palabra y un nivel:

- **Nivel 1 (traducción):** se ve la palabra en español y tres opciones en inglés.
- **Nivel 2 (definición):** se ve la definición en inglés y tres palabras.
- **Nivel 3 (dictado):** el juego dice la palabra y se escribe; no hay opciones.

Las **dos opciones equivocadas no están escritas a mano**: se sortean de las otras palabras del banco, y
cambian cada vez. Para que la ficha sea justa, cumplen estas reglas:

1. Cada una es de una **categoría distinta** a la de la respuesta y a la de la otra. Así nunca aparecen
   dos palabras que podrían ser la respuesta (como _bone_ y _heart_ para «una parte dentro del cuerpo»).
2. Las tres opciones son **completamente distintas** entre sí: no empiezan con la misma letra, ninguna
   contiene a otra y están a 3 o más letras de distancia (así el reconocedor de voz no las confunde).
3. **Ninguna se parece al enunciado.** Si la definición dijera «carrots», _carrot_ no puede ser una
   opción, porque se acertaría leyendo la pantalla en voz alta.

Para que las reglas siempre se puedan cumplir, el banco necesita **al menos 10 categorías** y varias
palabras de cada una. `pruebas/fichas.test.js` arma las 7200 fichas posibles del banco (60 palabras × 2
niveles × 60 sorteos) y comprueba cada una.

## Cómo agregar una palabra

1. Escoge una palabra de los libros 1 o 2 del mazo (o de otro libro, con `libro` = 3, 4…).
2. Escribe su entrada en `vocabulario.js`. Cuida estas cosas (las pruebas las comprueban):
   - La definición **no contiene la palabra** ni una casi igual (_teaches_ para _teacher_).
   - La traducción **no es un cognado casi idéntico** (_jardín_ y _garden_ no sirven).
   - No se repite ninguna palabra, traducción ni definición.
   - Una definición corta, de **16 palabras o menos**: se lee con prisa.
3. Asígnale una `categoria`. Usa una que ya exista si la palabra podría confundirse con las de esa
   categoría; crea una nueva si es de un tema aparte.
4. Pasa `npm test`.

**Evita** las palabras con dos usos muy distintos (_found_, _object_, _subject_, _theater_) y las que
solo se pueden definir con otras palabras difíciles.

## Lista para revisar el contenido

Las pruebas comprueban la forma, **no si el inglés suena natural ni si la traducción es la mejor**.
Eso lo tiene que mirar una persona. Para cada palabra:

- [ ] ¿La traducción es la que más se usa en el español de la clase (o del Perú)?
- [ ] ¿La definición es correcta y se entiende con inglés de nivel básico?
- [ ] ¿La definición podría describir **otra** palabra del banco? (Si sí, se cambia o se ajusta la categoría.)
- [ ] ¿La categoría separa bien las palabras que se pueden confundir?

## Qué falta

- Más palabras (60 alcanzan para probar, no para jugar mucho): hay 3540 más en el mazo.
- Elegir qué libros se usan en cada nivel del juego y en cada jefe.
- Que la repetición espaciada (estilo Anki) haga volver antes las palabras falladas.
