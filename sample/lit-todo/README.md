# lit-todo

Absurdy small, fully functioning local-first todo list using Replicache.

## Develop

```
npm install
npm run build # copies the wasm bundle to the right location
rollup -c --watch &
python -m SimpleHTTPServer
```

## Build for Release

```
npm run build
```

Then navigate to: http://localhost:8000/
