const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const mySerial = new SerialPort({
  path: "COM3",
  baudRate: 9600,
});

const parser = mySerial.pipe(new ReadlineParser({ delimiter: "\r\n" }));

mySerial.on("open", () => {
  console.log("Puerto Serial Abierto");
});

parser.on("data", (data) => {
  console.log(data);
});
