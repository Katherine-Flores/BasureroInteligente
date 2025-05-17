const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

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

// Estadísticas de uso
let stats = {
  organic: 0,      // Contador para basura orgánica
  recyclable: 0,   // Contador para basura reciclable
  history: []      // Historial de depósitos
};

// *** MODO SIMULACIÓN PARA PRUEBAS SIN ARDUINO ***
console.log('Ejecutando en modo de simulación...');

// Simulador de datos para pruebas
setInterval(() => {
  // Simular cambios en los niveles
  lastData.water += (Math.random() * 10) - 5;
  lastData.water = Math.min(Math.max(lastData.water, 0), 100);
  
  lastData.distance -= (Math.random() * 2) - 0.5;
  lastData.distance = Math.min(Math.max(lastData.distance, 5), 50);
  
  // Probabilidad de detección de objeto
  if (Math.random() > 0.7) {
    // Cambiar estado de detección
    lastData.objectDetected = !lastData.objectDetected;
    
    // Si se detectó un objeto
    if (lastData.objectDetected) {
      lastData.isOrganic = Math.random() > 0.5;
      
      // Actualizar estadísticas
      if (lastData.isOrganic) {
        stats.organic++;
      } else {
        stats.recyclable++;
      }
      
      // Agregar al historial
      stats.history.push({
        timestamp: new Date().toISOString(),
        type: lastData.isOrganic ? 'organic' : 'recyclable'
      });
      
      // Limitar el historial a 50 elementos
      if (stats.history.length > 50) {
        stats.history.shift();
      }
      
      // Emitir estadísticas actualizadas
      io.emit('statsUpdate', stats);
    }
  }
  
  // Emitir los datos simulados
  io.emit('sensorData', lastData);
}, 2000);

/*
// CÓDIGO PARA COMUNICACIÓN REAL CON ARDUINO
// Para usar con Arduino real, comenta la sección de simulación y descomenta esta sección

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

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
    if (data.includes('Basura orgánica detectada')) {
      lastData.isOrganic = true;
      stats.organic++;
    } else {
      lastData.isOrganic = false;
      stats.recyclable++;
    }
    
    // Agregar al historial
    stats.history.push({
      timestamp: new Date().toISOString(),
      type: lastData.isOrganic ? 'organic' : 'recyclable'
    });
    
    // Limitar el historial a 50 elementos
    if (stats.history.length > 50) {
      stats.history.shift();
    }
    
    // Emitir estadísticas actualizadas
    io.emit('statsUpdate', stats);
  } else {
    lastData.objectDetected = false;
  }
  
  // Emitir los datos a todos los clientes conectados
  io.emit('sensorData', lastData);
}

// Configuración del puerto serial
try {
  const mySerial = new SerialPort({
    path: 'COM3', // Cambiar a tu puerto (ej. /dev/ttyACM0 en Linux)
    baudRate: 9600
  });

  const parser = mySerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  mySerial.on('open', () => {
    console.log('Puerto Serial Abierto');
  });

  parser.on('data', (data) => {
    console.log(data);
    parseSerialData(data);
  });
  
  mySerial.on('error', (err) => {
    console.error('Error en el puerto serial:', err.message);
    console.log('Ejecutando en modo de simulación...');
  });
} catch (err) {
  console.error('No se pudo abrir el puerto serial:', err.message);
  console.log('Ejecutando en modo de simulación...');
}
*/

// Conexión de Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar los últimos datos al cliente cuando se conecta
  socket.emit('sensorData', lastData);
  
  // Enviar estadísticas actuales
  socket.emit('statsUpdate', stats);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
