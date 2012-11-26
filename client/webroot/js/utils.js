function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function capitalize(str) {
    return str.replace(/[\w\/]\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function timestampToTime(timestamp) {
	var time = new Date(timestamp*1000);
	return time.toLocaleTimeString().match(/^\d{2}:\d{2}/);
}

// Prefix 0's to a number
function pad (number, size) {
	number = String(number);
	while (number.length < size) { number = "0" + number; }
	return number;
}


function now () {
    return (new Date()).getTime();
}

function error (msg) {
    console.error(msg)
}
