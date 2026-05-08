#include <dummy.h>


#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>


// WIFI
const char* WIFI_SSID   = "Iphone De Aleff";
const char* WIFI_PASS   = "Aleff290505";


// HIVEMQ CLOUD
const char* MQTT_SERVER = "95c7472ab4f248759ef76a990528ec3e.s1.eu.hivemq.cloud";
const char* MQTT_USER   = "admin";
const char* MQTT_PASS   = "Admin123@";
const int   MQTT_PORT   = 8883;


// PINOS
#define LED_VERDE       16
#define LED_AMARELO     17
#define LED_VERMELHO    18
#define BUZZER_PIN      19
#define RELE_VENTOINHA  25
#define MQ2_PIN         34
#define FOGO_PIN        35


// LIMITES
const float LIMITE_TEMP    = 30.0;
const float LIMITE_UMIDADE = 60.0;
const int   LIMITE_GAS     = 550;


// OBJETOS
WiFiClientSecure wifi;
PubSubClient mqtt(wifi);
Adafruit_BME280 bme;


// ESTADOS
enum Estado { NORMAL, ALERTA, EMERGENCIA };
Estado estadoAtual = NORMAL;


// PUBLICAÇÃO MQTT
void publicar(float temp, float umid, float pressao, int gas, bool fogo, String estado) {
  StaticJsonDocument<256> doc;
  doc["device_id"]      = "sensor_01";
  doc["environment_id"] = "sala_museu_1";
  doc["temperature"]    = temp;
  doc["humidity"]       = umid;
  doc["pressure"]       = pressao;
  doc["gas"]            = gas;
  doc["fogo"]           = fogo;
  doc["estado"]         = estado;


  char buf[256];
  serializeJson(doc, buf);
  mqtt.publish("flex/sala_museu_1/sensor_01", buf);
}


void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Conectando ao HiveMQ...");
    if (mqtt.connect("esp32_sensor01", MQTT_USER, MQTT_PASS)) {
      Serial.println(" conectado!");
    } else {
      Serial.print(" falhou, rc=");
      Serial.println(mqtt.state());
      Serial.println("Tentando novamente em 5s...");
      delay(5000);
    }
  }
}


void setup() {
  Serial.begin(115200);


  pinMode(LED_VERDE,      OUTPUT);
  pinMode(LED_AMARELO,    OUTPUT);
  pinMode(LED_VERMELHO,   OUTPUT);
  pinMode(BUZZER_PIN,     OUTPUT);
  pinMode(RELE_VENTOINHA, OUTPUT);
  pinMode(MQ2_PIN,        INPUT);
  pinMode(FOGO_PIN,       INPUT);


  // Garante ventoinha desligada na inicialização (active-LOW)
  digitalWrite(RELE_VENTOINHA, HIGH);


  // Inicializa LEDC para o buzzer
  ledcAttach(BUZZER_PIN, 1000, 8);


  // I2C BME280
  Wire.begin(21, 22);
  if (!bme.begin(0x76)) {
    Serial.println("Erro BME280!");
    while (1);
  }


  // Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");


  wifi.setInsecure();
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
}


void loop() {
  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  mqtt.loop();


  // LEITURAS
  float temp    = bme.readTemperature();
  float umid    = bme.readHumidity();
  float pressao = bme.readPressure() / 100.0;
  int   gas     = analogRead(MQ2_PIN);
  bool  fogo    = (digitalRead(FOGO_PIN) == LOW);


  // MÁQUINA DE ESTADOS
  if (fogo || gas >= LIMITE_GAS) {
    estadoAtual = EMERGENCIA;
  }
  else if (temp >= LIMITE_TEMP || umid >= LIMITE_UMIDADE) {
    estadoAtual = ALERTA;
  }
  else {
    estadoAtual = NORMAL;
  }


  // AÇÕES
  switch (estadoAtual) {


    case NORMAL:
      digitalWrite(LED_VERDE,      HIGH);
      digitalWrite(LED_AMARELO,    LOW);
      digitalWrite(LED_VERMELHO,   LOW);
      ledcWriteTone(BUZZER_PIN,    0);
      digitalWrite(RELE_VENTOINHA, HIGH);  // ventoinha OFF
      publicar(temp, umid, pressao, gas, fogo, "NORMAL");
      Serial.println("NORMAL");
      break;


    case ALERTA:
      digitalWrite(LED_VERDE,      LOW);
      digitalWrite(LED_AMARELO,    HIGH);
      digitalWrite(LED_VERMELHO,   LOW);
      ledcWriteTone(BUZZER_PIN,    0);
      digitalWrite(RELE_VENTOINHA, LOW);   // ventoinha ON
      publicar(temp, umid, pressao, gas, fogo, "ALERTA");
      Serial.println("ALERTA");
      break;


    case EMERGENCIA:
      digitalWrite(LED_VERDE,      LOW);
      digitalWrite(LED_AMARELO,    LOW);
      digitalWrite(LED_VERMELHO,   HIGH);
      ledcWriteTone(BUZZER_PIN,    1000);
      digitalWrite(RELE_VENTOINHA, HIGH);  // ventoinha OFF
      publicar(temp, umid, pressao, gas, fogo, "EMERGENCIA");
      Serial.println("EMERGENCIA");
      break;
  }


  // DEBUG
  Serial.println("Temp: "      + String(temp));
  Serial.println("Umidade: "   + String(umid));
  Serial.println("Pressão: "   + String(pressao));
  Serial.println("Gas: "       + String(gas));
  Serial.println("Fogo: "      + String(fogo ? "SIM" : "NAO"));
  Serial.println("Ventoinha: " + String(estadoAtual == ALERTA ? "LIGADA" : "DESLIGADA"));
  Serial.println("----------------------");


  delay(1000);
}

