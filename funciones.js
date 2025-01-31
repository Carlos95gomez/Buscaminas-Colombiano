// Configuración del juego
let configuracion = {
    principiante: { size: 8, minas: 10 },
    intermedio: { size: 10, minas: 20 },
    experto: { size: 12, minas: 30 }
};

// Variables globales
let tablero = [];
let juegoTerminado = false;
let puntuacion = 0;
let mejorPuntuacion = 0;
let minasRestantes = 0;
let celdaSeleccionada = null;
let primerClick = true;

// Función principal para iniciar el juego
function iniciarJuego() {
    ocultarMenuAcciones();
    const nivel = document.getElementById('nivel').value;
    const { size, minas } = configuracion[nivel];
    
    tablero = [];
    juegoTerminado = false;
    puntuacion = 0;
    minasRestantes = minas;
    primerClick = true;
    
    document.getElementById('puntuacion').textContent = puntuacion;
    document.getElementById('minasRestantes').textContent = minasRestantes;
    
    // Crear tablero vacío
    for (let i = 0; i < size; i++) {
        tablero[i] = [];
        for (let j = 0; j < size; j++) {
            tablero[i][j] = {
                esMina: false,
                revelada: false,
                bandera: false,
                minasAlrededor: 0
            };
        }
    }

    dibujarTablero(size);
}

// Función para generar minas de manera segura después del primer click
function generarMinasSeguras(clickX, clickY) {
    const size = tablero.length;
    const nivel = document.getElementById('nivel').value;
    const numMinas = configuracion[nivel].minas;
    
    // Crear conjunto de posiciones seguras alrededor del primer click
    const posicionesSeguras = new Set();
    for(let i = -1; i <= 1; i++) {
        for(let j = -1; j <= 1; j++) {
            const newX = clickX + i;
            const newY = clickY + j;
            if(newX >= 0 && newX < size && newY >= 0 && newY < size) {
                posicionesSeguras.add(`${newX},${newY}`);
            }
        }
    }

    // Colocar minas evitando el área segura
    let minasColocadas = 0;
    while (minasColocadas < numMinas) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const posicion = `${x},${y}`;
        
        if (!posicionesSeguras.has(posicion) && !tablero[x][y].esMina) {
            tablero[x][y].esMina = true;
            minasColocadas++;
        }
    }

    // Calcular números después de colocar las minas
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (!tablero[i][j].esMina) {
                tablero[i][j].minasAlrededor = contarMinasAlrededor(i, j, size);
            }
        }
    }
}

// Función para contar minas alrededor de una celda
function contarMinasAlrededor(x, y, size) {
    let contador = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newX = x + i;
            const newY = y + j;
            if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                if (tablero[newX][newY].esMina) contador++;
            }
        }
    }
    return contador;
}

function dibujarTablero(size) {
    const tableroDiv = document.getElementById('tablero');
    tableroDiv.style.gridTemplateColumns = `repeat(${size}, 30px)`;
    tableroDiv.innerHTML = '';

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            tableroDiv.appendChild(celda);
            actualizarCelda(i, j);
        }
    }
}

function colocarBandera(x, y) {
    if (juegoTerminado || tablero[x][y].revelada) return;
    
    const celda = tablero[x][y];
    
    if (!celda.bandera) {
        celda.bandera = true;
        minasRestantes--;
    } else {
        celda.bandera = false;
        minasRestantes++;
    }
    
    actualizarCelda(x, y);
    document.getElementById('minasRestantes').textContent = minasRestantes;
}

// Función para revelar una celda
function revelarCelda(x, y) {
    if (juegoTerminado || tablero[x][y].revelada || tablero[x][y].bandera) return;

    // Generar minas en el primer click
    if (primerClick) {
        generarMinasSeguras(x, y);
        primerClick = false;
    }

    const celda = tablero[x][y];
    celda.revelada = true;
    
    const celdaDiv = document.getElementById('tablero').children[x * tablero.length + y];
    celdaDiv.classList.add('revelada');

    if (celda.esMina) {
        celdaDiv.innerHTML = '<i class="fas fa-bomb"></i>';
        celdaDiv.classList.add('mina');
        celdaDiv.style.backgroundColor = '#ff0000';
        finalizarJuego(false);
        mostrarModal('¡Has perdido!', '¡Has encontrado una mina! Puntuación final: ' + puntuacion);
    } else {
        if (celda.minasAlrededor > 0) {
            celdaDiv.textContent = celda.minasAlrededor;
            puntuacion += 10;
        } else {
            revelarAdyacentes(x, y);
            puntuacion += 5;
        }
        document.getElementById('puntuacion').textContent = puntuacion;

        if (verificarVictoria()) {
            finalizarJuego(true);
        }
    }
}

// Función para revelar celdas adyacentes
function revelarAdyacentes(x, y) {
    const size = tablero.length;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newX = x + i;
            const newY = y + j;
            if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                if (!tablero[newX][newY].revelada && !tablero[newX][newY].bandera) {
                    revelarCelda(newX, newY);
                }
            }
        }
    }
}

function actualizarCelda(x, y) {
    const celda = tablero[x][y];
    const celdaDiv = document.getElementById('tablero').children[x * tablero.length + y];
    
    celdaDiv.innerHTML = '';
    celdaDiv.classList.remove('bandera');
    
    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    
    const pala = document.createElement('span');
    pala.className = 'accion';
    pala.innerHTML = '<i class="fas fa-hand-pointer"></i>';
    pala.title = 'Revelar celda';
    pala.onclick = (e) => {
        e.stopPropagation();
        revelarCelda(x, y);
        ocultarMenuAcciones();
    };
    
    const bandera = document.createElement('span');
    bandera.className = 'accion';
    bandera.innerHTML = '<i class="fas fa-flag"></i>';
    bandera.title = 'Marcar/Desmarcar mina';
    bandera.onclick = (e) => {
        e.stopPropagation();
        colocarBandera(x, y);
        ocultarMenuAcciones();
    };
    
    acciones.appendChild(pala);
    acciones.appendChild(bandera);
    celdaDiv.appendChild(acciones);
    
    if (celda.bandera) {
        const banderaIcon = document.createElement('i');
        banderaIcon.className = 'fas fa-flag';
        celdaDiv.appendChild(banderaIcon);
        celdaDiv.classList.add('bandera');
    }

    celdaDiv.onclick = (e) => {
        e.stopPropagation();
        mostrarMenuAcciones(celdaDiv);
    };
}

function mostrarMenuAcciones(celdaDiv) {
    ocultarMenuAcciones();
    
    if (!celdaDiv.classList.contains('revelada')) {
        celdaDiv.classList.add('menu-activo');
        celdaSeleccionada = celdaDiv;
    }
}

function ocultarMenuAcciones() {
    if (celdaSeleccionada) {
        celdaSeleccionada.classList.remove('menu-activo');
        celdaSeleccionada = null;
    }
}

// Función para verificar victoria
function verificarVictoria() {
    const size = tablero.length;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (!tablero[i][j].esMina && !tablero[i][j].revelada) {
                return false;
            }
        }
    }
    return true;
}

function mostrarModal(titulo, mensaje) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-mensaje').textContent = mensaje;
    modal.style.display = 'flex';
}

function reiniciarJuego() {
    document.getElementById('modal').style.display = 'none';
    iniciarJuego();
}

function finalizarJuego(victoria) {
    juegoTerminado = true;
    
    if (victoria) {
        mostrarModal('¡Has ganado!', '¡Felicitaciones! Puntuación: ' + puntuacion);
        if (puntuacion > mejorPuntuacion) {
            mejorPuntuacion = puntuacion;
            document.getElementById('mejorPuntuacion').textContent = mejorPuntuacion;
        }
    } else {
        const size = tablero.length;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const celda = tablero[i][j];
                const celdaDiv = document.getElementById('tablero').children[i * size + j];
                
                if (celda.esMina) {
                    celdaDiv.innerHTML = '<i class="fas fa-bomb"></i>';
                    celdaDiv.classList.add('revelada');
                    
                    if (celda.bandera) {
                        celdaDiv.style.backgroundColor = '#90EE90';
                    } else {
                        celdaDiv.style.backgroundColor = '#ff4444';
                    }
                } else if (celda.bandera) {
                    celdaDiv.innerHTML = '<i class="fas fa-times"></i>';
                    celdaDiv.style.backgroundColor = '#FFB6C1';
                }
            }
        }
    }
}

// Iniciar el primer juego al cargar la página
document.addEventListener('DOMContentLoaded', iniciarJuego);