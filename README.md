# froggit_server
 Server to receive data from froggit weather stations. The data is optionally relaid via MQTT and can be saved to a MYSQL database. Multiple stations can be supported in parallel by one server.
# Configuration
Rename "EXAMPLE.env" to ".env" and enter settings that fit your system.

    DEBUG=false
    # Enable to convert data to usefull units
    TO_NON_RETARD=true
    PORT=7070
    MQTT_ENABLE=true
    MQTT_HOST=mqtt://192.168.1.1
    MQTT_CLIENT=wetterstationen
    MQTT_USER=niceUser
    MQTT_PASSWORD=goodPassword
    MQTT_TOPIC=wetterstation
    MYSQL_ENABLE=true
    MYSQL_HOST=localhost
    MYSQL_USER=niceUser
    MYSQL_PASSWORD=goodPassword
    # "STATION_KEY":"DATABASE.TABLE"
    MYSQL_DATABASE='{"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF":"wetterstation.breitenwaida"}'
# Install

    npm install 'https://github.com/Tobias0110/froggit_server.git'
