// Elementos del DOM
const organicValue = document.getElementById('organic-value');
const organicGauge = document.getElementById('organic-gauge');
const organicStatus = document.getElementById('organic-status');

const recyclableValue = document.getElementById('recyclable-value');
const recyclableGauge = document.getElementById('recyclable-gauge');
const recyclableStatus = document.getElementById('recyclable-status');

const objectIcon = document.getElementById('object-icon');
const objectStatus = document.getElementById('object-status');

const organicCount = document.getElementById('organic-count');
const recyclableCount = document.getElementById('recyclable-count');

const logContainer = document.getElementById('log-container');
const clearLogBtn = document.getElementById('clear-log');

// Función para actualizar el medidor del basurero orgánico
function updateOrganicGauge(distance) {
    const maxDistance = 50;
    let percentage = (1 - (distance / maxDistance)) * 100;
    percentage = Math.min(Math.max(percentage, 0), 100);
    
    const dashOffset = 126 - (percentage * 1.26);
    organicGauge.style.strokeDashoffset = dashOffset;
    organicValue.textContent = `${Math.round(percentage)}%`;
    
    if (percentage < 50) {
        organicStatus.className = 'status success';
        organicStatus.textContent = 'Disponible';
        organicGauge.style.stroke = '#4CAF50';
    } else if (percentage < 80) {
        organicStatus.className = 'status warning';
        organicStatus.textContent = 'Medio lleno';
        organicGauge.style.stroke = '#ff9800';
    } else {
        organicStatus.className = 'status danger';
        organicStatus.textContent = '¡Casi lleno!';
        organicGauge.style.stroke = '#f44336';
    }
}

// Función para actualizar el medidor del basurero reciclable
function updateRecyclableGauge(distance) {
    const maxDistance = 50;
    let percentage = (1 - (distance / maxDistance)) * 100;
    percentage = Math.min(Math.max(percentage, 0), 100);
    
    const dashOffset = 126 - (percentage * 1.26);
    recyclableGauge.style.strokeDashoffset = dashOffset;
    recyclableValue.textContent = `${Math.round(percentage)}%`;
    
    if (percentage < 50) {
        recyclableStatus.className = 'status success';
        recyclableStatus.textContent = 'Disponible';
        recyclableGauge.style.stroke = '#2196F3';
    } else if (percentage < 80) {
        recyclableStatus.className = 'status warning';
        recyclableStatus.textContent = 'Medio lleno';
        recyclableGauge.style.stroke = '#ff9800';
    } else {
        recyclableStatus.className = 'status danger';
        recyclableStatus.textContent = '¡Casi lleno!';
        recyclableGauge.style.stroke = '#f44336';
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
                label: 'Basurero Orgánico (%)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Basurero Reciclable (%)',
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
function updateChart(organicLevel, recyclableLevel) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    if (statsChart.data.labels.length > 10) {
        statsChart.data.labels.shift();
        statsChart.data.datasets[0].data.shift();
        statsChart.data.datasets[1].data.shift();
    }
    
    statsChart.data.labels.push(timeString);
    statsChart.data.datasets[0].data.push(organicLevel);
    statsChart.data.datasets[1].data.push(recyclableLevel);
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
    if (data.distanceOrganic !== undefined) {
        updateOrganicGauge(data.distanceOrganic);
    }
    
    if (data.distanceRecyclable !== undefined) {
        updateRecyclableGauge(data.distanceRecyclable);
        
        // Actualizar gráfico
        const organicLevel = (1 - (data.distanceOrganic / 50)) * 100;
        const recyclableLevel = (1 - (data.distanceRecyclable / 50)) * 100;
        updateChart(organicLevel, recyclableLevel);
    }
    
    if (data.objectDetected !== undefined) {
        updateObjectDetection(data.objectDetected, data.isOrganic);
        
        if (data.objectDetected) {
            addLogEntry(`Objeto ${data.isOrganic ? 'orgánico' : 'reciclable'} detectado`);
        }
    }
    
    // Registrar datos recibidos
    addLogEntry(`Orgánico: ${Math.round((1 - (data.distanceOrganic / 50)) * 100)}%, Reciclable: ${Math.round((1 - (data.distanceRecyclable / 50)) * 100)}%, Objeto: ${data.objectDetected ? 'Sí' : 'No'}`);
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
updateOrganicGauge(50);
updateRecyclableGauge(50);
updateObjectDetection(false);
addLogEntry('Sistema iniciado, esperando datos...');
