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
    APRS_HOST=euro.aprs2.net
    APRS_PORT=14580
    # "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" is an example for a froggit station key
    # if you don't want aprs: don't input a callsign
    STATIONS='{"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF":{"mysql":"wetterstation.breitenwaida","call":"N0CALL","ssid":10,"lat":"4780.60N","lon":"01604.02E","comment":"on my shed"}, "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE":{"mysql":"wetterstation.hollabrunn"}}'

# Install

    npm install 'https://github.com/Tobias0110/froggit_server.git'

## Create the database table

    CREATE TABLE breitenwaida (id BIGINT AUTO_INCREMENT PRIMARY KEY, timedate TIMESTAMP, humidityin int, humidity int, winddir int, solarradiation float, uv int, tempin float, baromrel float, baromabs float, temp float, windspeed float, windgust float, maxdailygust float, rainrate float, eventrain float, hourlyrain float, dailyrain float, weeklyrain float, monthlyrain float, yearlyrain float, dewpoint float);

## On the weather station

Set the IP address and port of the server. The path doesn't matter.
