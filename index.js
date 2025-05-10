const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuración de Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Variables para almacenar los últimos datos de los sensores
let lastData = {
  water: 0,
  distance: 50,
  objectDetected: false,
  isOrganic: false
};

// Función para analizar los datos del puerto serial
function parseSerialData(data) {
  console.log('Datos recibidos:', data);
  
  // Extraer nivel de agua
  if (data.includes('Agua:')) {
    const match = data.match(/Agua: (\d+)/);
    if (match && match[1]) {
      lastData.water = parseInt(match[1], 10);
    }
  }
  
  // Extraer distancia
  if (data.includes('Distancia:')) {
    const match = data.match(/Distancia: (\d+)/);
    if (match && match[1]) {
      lastData.distance = parseInt(match[1], 10);
    }
  }
  
  // Detectar objetos
  if (data.includes('Objeto Detectado')) {
    lastData.objectDetected = true;
    
    // Determinar si es orgánico o no
    if (data.includes('Por favor, colócala corectamente')) {
      lastData.isOrganic = false;
    } else {
      lastData.isOrganic = true;
    }
  } else {
    lastData.objectDetected = false;
  }
  
  // Emitir los datos a todos los clientes conectados
  io.emit('sensorData', lastData);
}

// *** PARA PRUEBAS: MODO SIMULACIÓN ACTIVADO ***
console.log('Ejecutando en modo de simulación...');

// Modo de simulación para probar sin Arduino
setInterval(() => {
  // Simular cambios en los datos
  lastData.water += (Math.random() * 10) - 5;
  lastData.water = Math.min(Math.max(lastData.water, 0), 100);
  
  lastData.distance -= (Math.random() * 2) - 0.5;
  lastData.distance = Math.min(Math.max(lastData.distance, 5), 50);
  
  if (Math.random() > 0.7) {
    lastData.objectDetected = !lastData.objectDetected;
    lastData.isOrganic = Math.random() > 0.5;
  }
  
  // Emitir los datos simulados
  io.emit('sensorData', lastData);
}, 2000);

// Conexión de Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar los últimos datos al cliente cuando se conecta
  socket.emit('sensorData', lastData);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});