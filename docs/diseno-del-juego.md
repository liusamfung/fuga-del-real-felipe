# Documento de diseño — Fuga del Real Felipe

> Transcripción en Markdown del borrador de un compañero del equipo
> ([original en Word](referencia/borrador-original.docx)). El contenido es el del borrador;
> aquí se puede editar y comentar con Git. El título del juego es provisional.

## 1. Premisa

Un prisionero ficticio, encerrado en la Fortaleza del Real Felipe durante el sitio del Callao
(1824–1826), debe escapar de las mazmorras inferiores y atravesar las alcantarillas y los muros
exteriores antes de que la fortaleza caiga o lo ejecuten. No busca salvar al país ni derrotar a
nadie: busca salir con vida y, en el camino, decide si ayuda a otros prisioneros.

**Género:** mazmorra / laberinto 2D con exploración lineal, evasión y eventos de reacción (QTE).

## 2. Contexto histórico y cercanía a lo real

- **Época:** sitio del Callao, 1824–1826. La fortaleza resistió bajo el mando realista de José
  Ramón Rodil incluso después de la capitulación española en Ayacucho (diciembre de 1824). Cayó
  finalmente en enero de 1826.
- **Nivel de fidelidad:** ficción históricamente inspirada, no recreación exacta.
  - **Real:** la fortaleza, el asedio, el hambre, las enfermedades, la resistencia de Rodil.
  - **Ficticio:** el protagonista, los prisioneros concretos, los documentos secretos y los
    eventos específicos de la fuga.
- Rodil existe como figura histórica y se menciona como autoridad lejana (órdenes, propaganda,
  miedo de los soldados), pero **no** aparece como jefe final ni como personaje jugable.
- El juego no pretende enseñar historia exacta, sino ambientar una mecánica de escape en un
  contexto real documentado. Se incluye una **nota histórica breve al final** que aclara qué es
  real y qué es ficción.

## 3. Perspectiva y estilo visual

- **Perspectiva:** 2D top-down pura (vista cenital). Un solo plano, legible, funcional para el
  laberinto y el QTE.
- **Estilo:** pixel art con paleta contenida y ambiente serio.
- **Paleta:** colores apagados pero no monocromáticos (marrones, grises, verdes sucios, azules
  fríos). Nada saturado ni vibrante, pero tampoco negro sobre negro.
- **Ambiente:** serio y algo sombrío, con contraste moderado. Legibilidad por encima de
  atmósfera.
- **Iluminación:** antorchas y velas como fuentes de luz estáticas y suaves. Sin efectos
  dinámicos. Viñeteado leve en los bordes de la pantalla.
- **Detalles:** grietas, cadenas, manchas, escombros. Suficiente textura, sin recargar.

### Progresión de paleta por zona

| Zona                     | Paleta                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Celdas inferiores        | Marrones, ocres, grises piedra. Algo de luz de antorcha (naranja apagado).                                                          |
| Alcantarillas            | Verdes sucios, azules apagados, agua turbia.                                                                                        |
| Patio y muros exteriores | Azules fríos, gris oscuro, luz de luna pálida.                                                                                      |
| Final (huida al mar)     | Cambio drástico a tonos cálidos y luminosos: amanecer, naranjas, amarillos suaves, azul del mar. Es la recompensa visual del juego. |

## 4. Objetivo del jugador

**Objetivo principal:** escapar de la fortaleza atravesando dos niveles lineales.

**Filosofía:** la tensión viene de huir y reaccionar, no de vencer. El jugador no es un héroe de
combate: es alguien que corre, se esconde y reacciona a tiempo.

## 5. Tipo de gameplay

**Bucle de juego:** explorar laberinto → detectar peligro → entrar en zona de riesgo → resolver
el QTE de reacción → avanzar → salir del nivel.

**Pilares:**

1. Exploración de laberinto lineal con sensación de desorientación.
2. Eventos de reacción ("!") como única interacción con enemigos y trampas.
3. Peligros ambientales (agua, derrumbe, humo, cañonazos).

**No hay:** combate cuerpo a cuerpo, IA de persecución, sistema de vida complejo, inventario
elaborado, jefe final ni ramificaciones narrativas grandes.

## 6. Mecánica central: eventos de reacción ("!")

Es el corazón del juego y la única forma de interactuar con enemigos y peligros.

### 6.1 Disparo del evento

El jugador entra en una zona de peligro (radio de un enemigo, trampa, zona de derrumbe) o pisa un
_trigger_ específico.

### 6.2 Secuencia

1. Suena el audio del peligro (gruñido, clic metálico, silbido, piedras). Es el _telegraph_
   principal.
2. 100–200 ms después aparece el "!" en pantalla.
3. Aparece la palabra a teclear o decir (fija, no cambia) con la barra de tiempo junto a ella,
   en un solo bloque visual centrado.
4. El mundo entra en cámara lenta (aprox. 0.2x, con rampa suave de entrada de 100–150 ms).
5. La barra de tiempo corre en **tiempo real**, no en tiempo de juego. El mundo se estira, el
   tiempo del jugador no.
6. El jugador teclea o dice la palabra:
   - **Acierta:** el "!" se rompe, sonido de éxito, el mundo vuelve a velocidad normal en
     ~200 ms, el peligro se neutraliza o se gana ventaja.
   - **Falla o se acaba el tiempo:** barra en rojo, sonido de impacto, consecuencia aplicada, el
     mundo vuelve a velocidad normal.

### 6.3 Tipos de evento

| Tipo             | Audio             | "!"      | Palabra de ejemplo   | Consecuencia al fallar              |
| ---------------- | ----------------- | -------- | -------------------- | ----------------------------------- |
| Enemigo          | Gruñido / paso    | Rojo     | ¡ALTO! / ¡QUIETO!    | Golpe, retroceso, pérdida de vida   |
| Trampa           | Clic metálico     | Amarillo | ¡ESPERA! / ¡CUIDADO! | Se activa la trampa, daño o bloqueo |
| Derrumbe / cañón | Piedras / silbido | Blanco   | ¡CORRE! / ¡ABAJO!    | El mapa cambia, ruta bloqueada      |

### 6.4 Reglas de justicia

- El "!" nunca aparece en mitad de un salto, caída o transición de sala.
- La palabra no cambia mientras la barra corre.
- El acierto devuelve el control de inmediato.
- El fallo es legible: se ve la consecuencia en pantalla.

## 7. Enemigos

**Principio de diseño:** el enemigo no persigue. Es una zona de peligro con reacción. Cuando el
jugador entra en su radio o cono, se dispara el "!". Si acierta, pasa. Si falla, recibe daño y
retrocede. El enemigo vuelve a su estado inicial. No hay IA de persecución ni _pathfinding_.

### 7.1 Preso loco / amotinado (Nivel 1)

- Está en un punto, balanceándose, golpeando la pared, murmurando.
- Radio de detección circular.
- Palabra: ¡QUIETO! / ¡ATRÁS! / ¡CALMA!
- **Acierto:** el preso se queda confundido un instante y el jugador pasa.
- **Fallo:** el preso lo golpea (pierde vida, retrocede al borde del radio).
- Encaja narrativamente: prisioneros desesperados por el hambre y el encierro que atacan a
  cualquiera.

### 7.2 Preso armado (variante, Nivel 1 tardío)

Mismo comportamiento que el preso loco, con parámetros distintos:

- Radio de detección más grande.
- Tiempo del QTE más corto.
- Golpe más fuerte.

**Función:** escalar la dificultad sin añadir mecánica nueva.

### 7.3 Militar / soldado (Nivel 2)

- Posición fija vigilando un paso.
- Zona de peligro en **cono de visión** (en vez de círculo).
- Palabra: ¡ALTO! / ¡RÍNDETE!
- **Acierto:** el jugador se esconde o pasa por el borde antes de que reaccione.
- **Fallo:** disparo, daño, retroceso forzado.
- **Función:** variedad visual y temática al final ("ahora son militares de verdad") sin añadir
  mecánica nueva.

### 7.4 Rata (entorno, no enemigo)

- No dispara "!". Es ambiente.
- Corre por el suelo, chilla, se mete en agujeros.
- **Función:** atmósfera + pista. Si las ratas corren en una dirección, algo las asustó.

## 8. Cómo funciona la opción de voz

La voz es un modo alternativo y **opcional** del QTE, no un sistema aparte.

### 8.1 Regla general

- **Modo teclado:** el jugador teclea la palabra dentro del tiempo estándar (3 s en Nivel 1,
  2 s en Nivel 2).
- **Modo voz:** el jugador dice la palabra. Tiene más tiempo (aprox. +50 %) porque hablar bajo
  presión es más difícil que teclear y porque el reconocimiento tarda en procesar.
- El jugador elige el modo al inicio y puede cambiarlo en opciones.

### 8.2 Flujo del modo voz

1. Se dispara el evento ("!" + palabra + barra).
2. El juego activa el micrófono automáticamente al inicio del evento.
3. El jugador dice la palabra.
4. El sistema devuelve el texto reconocido.
5. Se compara por similitud aproximada, no por igualdad exacta ("halto", "alto!" y "ALTO"
   cuentan).
6. Si coincide → acierto. Si no entiende → un reintento con la mitad del tiempo restante. Si
   vuelve a fallar → consecuencia.

### 8.3 Fallback y accesibilidad

- Si el dispositivo o el navegador no permite el reconocimiento de voz, el modo voz se desactiva
  automáticamente con un mensaje discreto.
- Si el usuario niega el permiso de micrófono, cae a teclado sin bloquear el juego.
- Si el reconocimiento falla en mitad de una partida, el juego no se detiene.
- Tiempo configurable o desactivable en opciones.
- Fallback visible a teclado siempre presente.

## 9. Niveles

Dos niveles lineales, sin jefe final. Cada nivel tiene un arco propio (entrar → atravesar →
salir) y un clímax de huida.

### Nivel 1 — Las mazmorras inferiores

**Tono:** encierro, confusión, primeros peligros. **Duración:** _por definir_.

1. Celda inicial (tutorial silencioso, primera pista).
2. Pasillo de celdas (primer preso loco, primer QTE).
3. Sala de interrogatorio (evento narrativo, QTE de trampa).
4. Túnel de mantenimiento (ratas, agua).
5. Compuerta a las alcantarillas (cierre del nivel).

**Aprendizajes:** moverse, QTE de enemigo y de trampa, distinguir sonidos.

### Nivel 2 — Alcantarillas y muros exteriores

**Tono:** agobio, agua, derrumbe, urgencia. **Duración:** _por definir_.

1. Alcantarillas inundadas (derrumbes, QTE de derrumbe).
2. Depósito de pólvora (incendios, humo).
3. Patio interior superior (primer militar, cono de visión, QTE de enemigo).
4. Brecha en el muro (bombardeo, QTE de cañonazo, el mapa cambia).
5. Salida al mar (pantalla final luminosa, texto breve, nota histórica).

**Aprendizajes:** el tiempo del QTE se acorta (3 s → 2 s); el entorno es tan peligroso como los
enemigos.

**Transición entre niveles:** texto breve, cambio de paleta, respiro sin reinicio.

## 10. Personajes

- **Protagonista (ficticio):** un mensajero independentista capturado, o un presidiario
  condenado injustamente. No busca salvar al Perú: busca escapar y, en el camino, decide si
  ayuda a otros. Su arco es el de un prisionero que recupera su voz (literal y
  metafóricamente, con el modo voz).
- **Antagonista (histórico, no jefe):** José Ramón Rodil. Presente a través de órdenes escritas,
  propaganda y soldados que le temen. Motivación compleja: cree que rendirse es abandonar a sus
  hombres y a los civiles refugiados. No se enfrenta directamente.
- **Secundarios:** prisioneros con los que se cruza, un oficial que duda, un médico de la
  enfermería.

## 11. Tono y atmósfera

Serio y contenido, sin gore. El peligro es constante pero legible. La atmósfera se construye con
audio (gruñidos, agua, pasos, crujidos), paleta apagada con color suficiente para no ser
opresiva, y contrastes moderados. Componente sobrenatural opcional solo en los túneles más
profundos: susurros, sombras ambiguas que podrían ser alucinaciones por hambre y fiebre. Nunca se
confirma si son reales.

El final, en cambio, es luminoso y cálido. La salida al mar cambia por completo la paleta: ese
contraste es la recompensa visual del juego.

## 12. Resumen ejecutivo

| Aspecto                  | Decisión                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Género                   | Mazmorra / laberinto 2D con exploración lineal y eventos de reacción                             |
| Perspectiva              | 2D top-down pura                                                                                 |
| Estilo                   | Pixel art, paleta apagada con color contenido, ambiente serio                                    |
| Época                    | Sitio del Callao, 1824–1826 (ficción históricamente inspirada)                                   |
| Protagonista             | Ficticio (prisionero que escapa)                                                                 |
| Antagonista              | Rodil como presencia histórica, no jefe final                                                    |
| Niveles                  | 2 lineales (mazmorras inferiores → alcantarillas y muros exteriores)                             |
| Duración total           | 20–25 min                                                                                        |
| Mecánica central         | Eventos de reacción "!" con audio-_telegraph_, cámara lenta, barra en tiempo real, teclado o voz |
| Interacción con enemigos | Solo QTE. Sin persecución ni IA compleja                                                         |
| Enemigos                 | Preso loco, preso armado (variante), militar, rata (entorno)                                     |
| Peligros                 | Agua, derrumbe, humo, incendio, cañonazo                                                         |
| Modo voz                 | Opcional, +50 % de tiempo, fallback a teclado                                                    |
| Combate                  | No hay. Solo evasión y reacción                                                                  |
| Sobrenatural             | Opcional y ambiguo, solo en túneles profundos                                                    |
| Fin                      | Huida al mar, paleta luminosa, texto breve, nota histórica                                       |
| Accesibilidad            | Fallback de voz, tiempos configurables, QTE nunca en momentos injustos                           |

---

_El borrador no incluye animación, tamaños de sprites ni tecnología. Cuando el equipo pruebe el
estilo de dibujo y defina el tamaño del píxel, se añadirá esa sección visual._
