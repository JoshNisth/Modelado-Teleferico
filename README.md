# Simulador — Teleférico Bolivia (HTML/CSS/JS)

Simulación discreta por minuto basada en tu modelo en Python:
- Arribos por minuto usando Poisson (método inverso)
- Cola de pasajeros (NPC)
- Atención según cabinas, capacidad (CC) y tiempos (TEC + TAP·pasajeros)
- Métricas: TME, TTVL, PA, PNA, CMO y promedios

## Cómo usar

1. Abre `index.html` (doble clic) y debería correr.
2. Ajusta parámetros.
3. Click en **Simular**.

Opcional (si quieres): puedes correr un servidor estático:
- `py -m http.server 5173` y abrir `http://localhost:5173/`

## Estructura

- `index.html`: UI
- `src/css/styles.css`: estilos (tema Morada por defecto)
- `src/js/sim/*`: motor de simulación
- `src/js/ui/*`: render y lectura de formulario
- `src/js/utils/*`: RNG, formato
