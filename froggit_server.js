import http from 'http'
import querystring from 'node:querystring'
import dotenv from 'dotenv'
import mqtt from 'mqtt'
import mysql from 'mysql'
import convert from 'convert-units'

function TD(r,T) {
  let a, b;
	if(T >= 0)
	{
		a = 7.5;
		b = 237.3;
	}
	else
	{
		a = 7.6;
		b = 240.7;
	}

	let sdd = 6.1078 * Math.exp(((a*T)/(b+T))/Math.LOG10E);
  let dd = r/100 * sdd;
  let c = Math.log(dd/6.1078) * Math.LOG10E;
  let dewpoint = (b * c) / (a - c);

  return dewpoint;
}

dotenv.config()

let mysql_keys = JSON.parse(process.env.MYSQL_DATABASE);

let con = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD
});

if(process.env.MYSQL_ENABLE == 'true') {
con.connect(function(err) {
  if (err) throw err;
  console.log("[MYSQL] Connected!");
});
}

// Connect to the mqtt server with username and password
let mqttClient = null;
if( process.env.MQTT_ENABLE == 'true' ) {
  mqttClient = await mqtt.connectAsync(process.env.MQTT_HOST, {
    clientId: process.env.MQTT_CLIENT,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    rejectUnauthorized: false
  })

  console.log('[MQTT] Connected!')

  // Setup event listeners for errors or reconnect
  mqttClient.on('reconnect', () => {
    console.error('[MQTT] Reconnected to server')
  }).on('error', error => {
    console.error('[MQTT] Error:', error)
  })
}


const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let data = '';
    req.on('data', chunk => {
      data += chunk.toString();
    });
    req.on('end', () => {
      res.end('Data received!');
      let parsed_data = querystring.parse(data);
      if(process.env.DEBUG == 'true') console.log(parsed_data);
      //Check if received data contains a PASSKEY and if we know this key from our config
      if((Object.hasOwn(parsed_data, 'PASSKEY')) && (Object.hasOwn(mysql_keys, parsed_data.PASSKEY) == false)) {
        console.log('[Froggit] Got data from unknown station with KEY:', parsed_data.PASSKEY);
      }
      else if((Object.hasOwn(parsed_data, 'PASSKEY')) && (Object.hasOwn(mysql_keys, parsed_data.PASSKEY))) {
      //Do this to remove units from variabls names (visible in MQTT JSON)
      let names_no_units = {};
      names_no_units.PASSKEY = parsed_data.PASSKEY;
      names_no_units.stationtype = parsed_data.stationtype;
      names_no_units.runtime = parseInt(parsed_data.runtime);
      names_no_units.heap = parseInt(parsed_data.heap);
      names_no_units.batt = parseInt(parsed_data.wh65batt);
      names_no_units.freq = parsed_data.freq;
      names_no_units.model = parsed_data.model;
      names_no_units.interval = parseInt(parsed_data.interval);
      names_no_units.dateutc = parsed_data.dateutc;
      names_no_units.humidityin = parseInt(parsed_data.humidityin);
      names_no_units.humidity = parseInt(parsed_data.humidity);
      names_no_units.winddir = parseInt(parsed_data.winddir);
      names_no_units.solarradiation = parseFloat(parsed_data.solarradiation);
      names_no_units.uv = parseInt(parsed_data.uv);
      //Convert to more usefull units if the user wishes to do so
      if(process.env.TO_NON_RETARD == 'true') {
        names_no_units.tempin = Math.round(convert(parsed_data.tempinf).from('F').to('C')*10) / 10;
        names_no_units.baromrel = Math.round(33.865 * parsed_data.baromrelin*100) / 100;
        names_no_units.baromabs = Math.round(33.865 * parsed_data.baromabsin*100) / 100;
        names_no_units.temp = Math.round(convert(parsed_data.tempf).from('F').to('C')*10) / 10;
        names_no_units.windspeed = Math.round(convert(parsed_data.windspeedmph).from('m/h').to('km/h')*100) / 100;
        names_no_units.windgust = Math.round(convert(parsed_data.windgustmph).from('m/h').to('km/h')*100) / 100;
        names_no_units.maxdailygust = Math.round(convert(parsed_data.maxdailygust).from('m/h').to('km/h')*100) / 100;
        names_no_units.rainrate = Math.round(convert(parsed_data.rainratein).from('in').to('mm')*100) / 100;
        names_no_units.eventrain = Math.round(convert(parsed_data.eventrainin).from('in').to('mm')*100) / 100;
        names_no_units.hourlyrain = Math.round(convert(parsed_data.hourlyrainin).from('in').to('mm')*100) / 100;
        names_no_units.dailyrain = Math.round(convert(parsed_data.dailyrainin).from('in').to('mm')*100) / 100;
        names_no_units.weeklyrain = Math.round(convert(parsed_data.weeklyrainin).from('in').to('mm')*100) / 100;
        names_no_units.monthlyrain = Math.round(convert(parsed_data.monthlyrainin).from('in').to('mm')*100) / 100;
        names_no_units.yearlyrain = Math.round(convert(parsed_data.yearlyrainin).from('in').to('mm')*100) / 100;
        names_no_units.dewpoint = TD(names_no_units.humidity, names_no_units.temp);
        names_no_units.metric = 1;
      }
      else
      {
        names_no_units.tempin = parseFloat(parsed_data.tempinf);
        names_no_units.baromrel = parseFloat(parsed_data.baromrelin);
        names_no_units.baromabs = parseFloat(parsed_data.baromabsin);
        names_no_units.temp = parseFloat(parsed_data.tempf);
        names_no_units.windspeed = parseFloat(parsed_data.windspeedmph);
        names_no_units.windgust = parseFloat(parsed_data.windgustmph);
        names_no_units.maxdailygust = parseFloat(parsed_data.maxdailygust);
        names_no_units.rainrate = parseFloat(parsed_data.rainratein);
        names_no_units.eventrain = parseFloat(parsed_data.eventrainin);
        names_no_units.hourlyrain = parseFloat(parsed_data.hourlyrainin);
        names_no_units.dailyrain = parseFloat(parsed_data.dailyrainin);
        names_no_units.weeklyrain = parseFloat(parsed_data.weeklyrainin);
        names_no_units.monthlyrain = parseFloat(parsed_data.monthlyrainin);
        names_no_units.yearlyrain = parseFloat(parsed_data.yearlyrainin);
        names_no_units.dewpoint = TD(names_no_units.humidity, convert(parsed_data.tempf).from('F').to('C'));
        names_no_units.dewpoint = convert(names_no_units.dewpoint).from('C').to('F');
        names_no_units.metric = 0;
      }
      console.log('[Froggit] Data received with timestamp:', names_no_units.dateutc, 'KEY:', names_no_units.PASSKEY);
      if(process.env.DEBUG == 'true') console.log(names_no_units);
      if(process.env.MQTT_ENABLE == 'true') mqttClient.publish(process.env.MQTT_TOPIC, JSON.stringify(names_no_units));
      if(process.env.MYSQL_ENABLE == 'true') {
        let sql_data = new Array();
        sql_data.push(mysql_keys[names_no_units.PASSKEY]);
        sql_data.push(names_no_units.dateutc);
        sql_data.push(names_no_units.humidityin);
        sql_data.push(names_no_units.humidity);
        sql_data.push(names_no_units.winddir);
        sql_data.push(names_no_units.solarradiation);
        sql_data.push(names_no_units.uv);
        sql_data.push(names_no_units.tempin);
        sql_data.push(names_no_units.baromrel);
        sql_data.push(names_no_units.baromabs);
        sql_data.push(names_no_units.temp);
        sql_data.push(names_no_units.windspeed);
        sql_data.push(names_no_units.windgust);
        sql_data.push(names_no_units.maxdailygust);
        sql_data.push(names_no_units.rainrate);
        sql_data.push(names_no_units.eventrain);
        sql_data.push(names_no_units.hourlyrain);
        sql_data.push(names_no_units.dailyrain);
        sql_data.push(names_no_units.weeklyrain);
        sql_data.push(names_no_units.monthlyrain);
        sql_data.push(names_no_units.yearlyrain);
        sql_data.push(names_no_units.dewpoint);
        con.query('INSERT INTO ?? (timedate, humidityin, humidity, winddir, solarradiation, uv, tempin, baromrel, baromabs, temp, windspeed, windgust, maxdailygust, rainrate, eventrain, hourlyrain, dailyrain, weeklyrain, monthlyrain, yearlyrain, dewpoint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', sql_data, function (err, result){
          if (err) throw err;
        console.log("[MYSQL] Record inserted into:", mysql_keys[names_no_units.PASSKEY], 'KEY:', names_no_units.PASSKEY);
      });
      }
      else console.log('[Froggit] Got data with unsupported fromat.');
    }
    });
  } else {
    res.end('Point your FROGGIT weather station to this Server. Path doesn\'t matter. You only need to set the IP and port.');
  }
});

server.listen(process.env.PORT, () => {
  console.log('[Froggit] Server running on port', process.env.PORT);
});