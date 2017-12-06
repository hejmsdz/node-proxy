# node-proxy

## Primeros pasos

```bash
git clone https://github.com/hejmsdz/node-proxy
cd node-proxy
npm start
```

El puerto por defecto es 8080, si lo quieres cambiar, puedes pasarlo como un parámetro a `npm start`.
Configura tu navegador/sistema que utilice el servidor proxy `localhost:8080` (o `localhost:loquesea`)
e intenta a abrir alguna página sin HTTPS.

## Estándares

Subjeto a discusión :)

* Colocamos todas las funcionalidades en la carpeta `src/`, como módulos mas o menos independientes.
* Usamos nuevas características de ES6+ ([gúia de referencia rápida](https://devhints.io/es6)) cuando sea posible, excepto palabras clave `import`/`export` de módulos que todavía no funcionan en el entorno NodeJS.
* Repartimos el trabajo mediante *issues*. ¡Trabajamos en ramas, hacemos *pull requests*!
* Escribimos el código en inglés, al menos los nombres de variables y funciones. Comentarios, mensajes y descripciones de *commits* los podemos poner en castellano, si preferís.
* Indentación con 2 espacios.
