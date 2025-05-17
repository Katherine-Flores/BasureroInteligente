// Elementos del DOM
const waterValue = document.getElementById('water-value');
const waterGauge = document.getElementById('water-gauge');
const waterStatus = document.getElementById('water-status');

const fillValue = document.getElementById('fill-value');
const fillGauge = document.getElementById('fill-gauge');
const fillStatus = document.getElementById('fill-status');

const objectIcon = document.getElementById('object-icon');
const objectStatus = document.getElementById('object-status');

const organicCount = document.getElementById('organic-count');
const recyclableCount = document.getElementById('recyclable-count');

const logContainer = document.getElementById('log-container');
const clearLogBtn = document.getElementById('clear-log');

// Función para actualizar el medidor de agua
function updateWaterGauge(value) {
    const percentage = Math.min(Math.max(value, 0), 100);
    const dashOffset = 126 - (percentage * 1.26);
    waterGauge.style.strokeDashoffset = dashOffset;
    waterValue.textContent = `${Math.round(percentage)}%`;
    
    if (percentage < 30) {
        waterStatus.className = 'status success';
        waterStatus.textContent = 'Seco';
        waterGauge.style.stroke = '#2196F3';
    } else if (percentage < 70) {
        waterStatus.className = 'status warning';
        waterStatus.textContent = 'Húmedo';
        waterGauge.style.stroke = '#ff9800';
    } else {
        waterStatus.className = 'status danger';
        waterStatus.textContent = 'Muy Húmedo';
        waterGauge.style.stroke = '#f44336';
    }
}

// Función para actualizar el medidor de llenado
function updateFillGauge(distance) {
    // Suponemos que el basurero tiene 50cm de altura
    const maxDistance = 50;
    // Convertimos la distancia a porcentaje de llenado (invertido)
    let percentage = (1 - (distance / maxDistance)) * 100;
    percentage = Math.min(Math.max(percentage, 0), 100);
    
    const dashOffset = 126 - (percentage * 1.26);
    fillGauge.style.strokeDashoffset = dashOffset;
    fillValue.textContent = `${Math.round(percentage)}%`;
    
    if (percentage < 50) {
        fillStatus.className = 'status success';
        fillStatus.textContent = 'Disponible';
        fillGauge.style.stroke = '#4CAF50';
    } else if (percentage < 80) {
        fillStatus.className = 'status warning';
        fillStatus.textContent = 'Medio lleno';
        fillGauge.style.stroke = '#ff9800';
    } else {
        fillStatus.className = 'status danger';
        fillStatus.textContent = '¡Casi lleno!';
        fillGauge.style.stroke = '#f44336';
    }
}

// Función para actualizar el estado de detección de objetos
function updateObjectDetection(detected, organic) {
    if (detected) {
        objectIcon.style.color = '#4CAF50';
        
        if (organic !== undefined) {
            if (organic) {
                objectIcon.innerHTML = '<i class="fas fa-apple-alt"></i>';
                objectStatus.className = 'status success';
                objectStatus.textContent = 'Objeto Orgánico Detectado';
            } else {
                objectIcon.innerHTML = '<i class="fas fa-recycle"></i>';
                objectStatus.className = 'status warning';
                objectStatus.textContent = 'Objeto Reciclable Detectado';
            }
        } else {
            objectIcon.innerHTML = '<i class="fas fa-box"></i>';
            objectStatus.className = 'status warning';
            objectStatus.textContent = 'Objeto Detectado';
        }
    } else {
        objectIcon.style.color = '#ccc';
        objectIcon.innerHTML = '<i class="fas fa-box"></i>';
        objectStatus.className = 'status';
        objectStatus.textContent = 'No se detecta objeto';
    }
}

// Función para agregar entradas al registro
function addLogEntry(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Limpia el registro de eventos
clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
    addLogEntry('Registro limpiado');
});

// Configuración del gráfico de estadísticas
const ctx = document.getElementById('stats-chart').getContext('2d');
const statsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Nivel de Llenado (%)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Nivel de Agua (%)',
                data: [],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Porcentaje (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Tiempo'
                }
            }
        }
    }
});

// Configuración del gráfico de uso
const usageCtx = document.getElementById('usage-chart').getContext('2d');
const usageChart = new Chart(usageCtx, {
    type: 'pie',
    data: {
        labels: ['Orgánico', 'Reciclable'],
        datasets: [{
            data: [0, 0],
            backgroundColor: [
                'rgba(139, 195, 74, 0.7)',
                'rgba(33, 150, 243, 0.7)'
            ],
            borderColor: [
                'rgba(139, 195, 74, 1)',
                'rgba(33, 150, 243, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Actualizar el gráfico con nuevos datos
function updateChart(fillLevel, waterLevel) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    if (statsChart.data.labels.length > 10) {
        statsChart.data.labels.shift();
        statsChart.data.datasets[0].data.shift();
        statsChart.data.datasets[1].data.shift();
    }
    
    statsChart.data.labels.push(timeString);
    statsChart.data.datasets[0].data.push(fillLevel);
    statsChart.data.datasets[1].data.push(waterLevel);
    statsChart.update();
}

// Conexión Socket.io
const socket = io();

socket.on('connect', () => {
    addLogEntry('Conectado al servidor de datos');
});

socket.on('disconnect', () => {
    addLogEntry('Desconectado del servidor de datos');
});

socket.on('sensorData', (data) => {
    console.log('Datos recibidos:', data);
    
    // Actualizar UI con datos recibidos
    if (data.water !== undefined) {
        updateWaterGauge(data.water);
    }
    
    if (data.distance !== undefined) {
        updateFillGauge(data.distance);
        
        // Actualizar gráfico
        const fillLevel = (1 - (data.distance / 50)) * 100;
        updateChart(fillLevel, data.water || 0);
    }
    
    if (data.objectDetected !== undefined) {
        updateObjectDetection(data.objectDetected, data.isOrganic);
        
        if (data.objectDetected) {
            addLogEntry(`Objeto ${data.isOrganic ? 'orgánico' : 'reciclable'} detectado`);
        }
    }
    
    // Registrar datos recibidos
    addLogEntry(`Agua: ${Math.round(data.water)}%, Distancia: ${Math.round(data.distance)}cm, Objeto: ${data.objectDetected ? 'Sí' : 'No'}`);
});

// Manejar actualizaciones de estadísticas
socket.on('statsUpdate', (stats) => {
    console.log('Estadísticas recibidas:', stats);
    
    // Actualizar contadores
    organicCount.textContent = stats.organic;
    recyclableCount.textContent = stats.recyclable;
    
    // Actualizar gráfico de uso
    usageChart.data.datasets[0].data = [stats.organic, stats.recyclable];
    usageChart.update();
    
    // Agregar entrada al registro
    addLogEntry(`Estadísticas actualizadas - Orgánico: ${stats.organic}, Reciclable: ${stats.recyclable}`);
});

// Inicialización
updateWaterGauge(0);
updateFillGauge(50);
updateObjectDetection(false);
addLogEntry('Sistema iniciado, esperando datos...');
