#!/bin/bash
# Arranca un servidor local y abre el juego en el navegador (alternativa a abrir index.html directamente)
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8765/" ) &
python3 -m http.server 8765
