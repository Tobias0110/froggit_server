import net from 'node:net';
import convert from 'convert-units';

//https://apps.magicbug.co.uk/passcode/
//https://om1amj.sk/index.php/conversion-of-gps-coordinates-to-aprs-format

function aprspass (callsign) {
    let hash = 0x73E2;
    let l = callsign.length;
    let i = 0;
    while(i < l) {
        hash ^= callsign.charCodeAt(i)<<8;
        hash ^= callsign.charCodeAt(i+1);
        i = i+2;
    }
    return hash & 0x7fff;
}

function pad(num, size) {
    num = Math.round(num);
    if(num >= 0) {
        num = num.toString();
        while (num.length < size) num = '0' + num;
    }
    else {
        num = (num*-1).toString();
        while (num.length < size-1) num = '0' + num;
        num = '-' + num;
    }
    return num;
}

function lum(rad) {
    let lum_str;
    if(rad > 999) {
        lum_str = 'l' + pad(rad-1000, 3);
    }
    else {
        lum_str = 'L' + pad(rad, 3);
    }
    return lum_str;
}

function hum(raw) {
    let hum_str;
    if(raw == 100) {
        hum_str = '00';
    }
    else {
        hum_str = pad(raw, 2);
    }
    return hum_str;
}

function check_tel(input) {
    let output = Math.round(input);
    if(output > 255) output = 255;
    else if(output < 0) output = 0;
    return output.toString();
}

function bits(uv, bat) {
    let output = '';
    if(uv>10) output = '10000';
    else if(uv>7) output = '01000';
    else if(uv>5) output = '00100';
    else if(uv>2) output = '00010';
    else if(uv>0) output = '00001';
    else output = '00000';
    return output + bat.toString();
}

function send_aprs(values, settings, num, dryrun) {
    let mqtt = {};

    mqtt.station = settings.call + '-' + settings.ssid;
    let time = new Date((values.dateutc).replace(' ', 'T') + '.000Z');
    let path_wx = settings.call + '-' + settings.ssid + '>APRSWX,TCPIP*:';
    let complete_wx = '@' + pad(time.getUTCHours(), 2) + pad(time.getUTCMinutes(), 2) + pad(time.getUTCSeconds(), 2) + 'h' + settings.lat + '/' + settings.lon + '_' + pad(values.winddir, 3) + '/' + pad(values.windspeedmph, 3) + 'g' + pad(values.windgustmph, 3) + 't' + pad(values.tempf, 3) + 'r' + pad(values.hourlyrainin*100, 3) + lum(values.solarradiation) + 'P' + pad(values.dailyrainin*100, 3) + 'h' + hum(values.humidity) + 'b' + pad((33.865*values.baromrelin)*10, 5);
    mqtt.wx = complete_wx;
    let path_tele = settings.call + '-' + settings.ssid + '>APRS,TCPIP*:';
    let parm = ':' + settings.call + '-' + settings.ssid + ':PARM.Rweek,Rmonth,Ryear,Rrate,dewp,UV>10,UV>7,U>5,U>2,U>0,BL';
    mqtt.parm = parm;
    let unit = ':' + settings.call + '-' + settings.ssid + ':UNIT.mm,mm,mm,mm/h,C,OK,OK,OK,OK,OK,YY';
    if(values.metric == false) unit = ':' + settings.call + '-' + settings.ssid + ':UNIT.in,in,in,in/h,F,OK,OK,OK,OK,OK,YY';
    mqtt.unit = unit;
    let eqns = ':' + settings.call + '-' + settings.ssid + ':EQNS.0,1.57,0,0,1.57,0,0,7.84,0,0,1,0,0,1,-127';
    mqtt.eqns = eqns;
    let tel_report = 'T#' + pad(num, 3) + ',' + check_tel(convert(values.weeklyrainin).from('in').to('mm')/1.57) + ',' + check_tel(convert(values.monthlyrainin).from('in').to('mm')/1.57) + ',' + check_tel(convert(values.yearlyrainin).from('in').to('mm')/7.84) + ',' + check_tel(convert(values.rainratein).from('in').to('mm')) + ',' + check_tel(convert(values.dewpointf).from('F').to('C')+127) + ',' + bits(values.uv, values.wh65batt);
    if(values.metric == false) tel_report = 'T#' + pad(num, 3) + ',' + check_tel(values.weeklyrainin/1.57) + ',' + check_tel(values.monthlyrainin/1.57) + ',' + check_tel(values.yearlyrainin/7.84) + ',' + check_tel(values.rainratein) + ',' + check_tel(values.dewpointf+127) + ',' + bits(values.uv, values.wh65batt);
    mqtt.tele = tel_report;
    let status = '>Github: froggit_server, ' + settings.comment;
    mqtt.status = status;

    let client = new net.Socket();
    client.connect(settings.port, settings.host, function() {
        console.log('[APRS] CONNECTED TO: ' + settings.host + ':' + settings.port);
        let ident = 'user ' + settings.call + ' pass ' + settings.pass + ' vers "froggit_server" \n';
        if(dryrun == false) {
        client.write(ident);
        client.write(path_wx + complete_wx + '\n');
        client.write(path_tele + parm + '\n');
        client.write(path_tele + unit + '\n');
        client.write(path_tele + eqns + '\n');
        client.write(path_tele + tel_report + '\n');
        client.write(path_tele + status + '\n');
        }

        client.end();
        client.destroy();

    });

    client.on('error', function(ex) {
        console.log("[APRS] ERROR:");
        console.log(ex);
    });

return mqtt;
}

export default {send_aprs, aprspass};
