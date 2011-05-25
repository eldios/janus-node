#!/usr/bin/env node

var mangleBits = function (bits){
	var result = bits ;
	//	change the bits as you prefer and then return them
	//	nothing will be done by default.. kind echo-ing them
	//	.. or you can try ..
	//	result = janusBasicExample(bits);
	return result;
}

// **********************************
// ** REMOVE THE EXAMPLE FUNCTION  **
// ** BELOW AS SOON AS YOU HAVE A  **
// ** CUSTOM FUNCTION ON YOU OWN   **
// **********************************
// ** THE FOLLOWING FUNCTION WILL  **
// ** CREATE A NEW STREAM LIKE     **
// ** |--16bit--|--original pkt--| **
// ** WHERE THE 16bit PART IS THE  **
// ** SIZE OF THE WHOLE original   **
// ** pkt OR 0xFF IF THE SIZE IS   **
// ** BIGGER THAN uint16 MAX SIZE  **
// **********************************
var janusBasicExample = function(bits){
	var	inspect = require('sys').inspect ,
			result = new Buffer(bits.length+2) ,
			bitsLengthArray = bits.length.toString(16).split('') , 
			padding;
	if (bitsLengthArray.length == 1) {
		padding = new Buffer([0].concat(bitsLengthArray)); 
	} else if (bitsLengthArray.length == 2) {
		padding = new Buffer(bitsLengthArray); 
	} else {
		//buffer already got too big, we shouold complain with someone about this
		// throw "You Buffer is way *too* big!"
		var errorString = [
		"-> Capn', we're losing some data over here! :( <-",
		"-> Stream truncated at 0xFF sorry..            <-"
		].join('\n');
		console.error(errorString);
		padding = new Buffer([255,255]);
	};
	padding.copy(result,0,padding.length-2,padding.length);
	bits.copy(result,2,0,bits.length);
	return result ;
};

// **********************************
// ** DO NOT TOUCH CODE BELOW HERE **
// **********************************

var codeVersion = '0.7.9',
		net = require('net') ,
		tcpClientIn , tcpClientOut ,
		// janus default config
		defInHost = '127.0.0.1' , defInPort = 30201 ,
		defOutHost = '127.0.0.1' , defOutPort = 10203 ;

function printHelp() {
	var titleString = '** JANUS POC JS client ' + codeVersion + ' **' ,
			columnWidth = titleString.length ,
			drawStarSeparator = function (char,length) {
				var finalSeparator = [] ;
				for (var i=0;i<length;i++)
					finalSeparator.push(char)
				return finalSeparator.join('');
			};
			usageExplanation = [ 
				'/' + drawStarSeparator('*',columnWidth-2) + '\\',
				titleString,
				drawStarSeparator('*',columnWidth),
				'Simply launch it with:',
				'  node janus-client.js --def',
				'or',
				' ./janus-client.js --def',
				drawStarSeparator('*',columnWidth),		
				'With --def arg it will default to:',
				'  IN 127.0.0.1:30201',
				'  OUT 127.0.0.1:10203',
				drawStarSeparator('*',columnWidth),		
				'You can otherwise pass some ARGS like',
				'--help  ->  shows this help',
				'--def   ->  launch Janus POC JS client with default values',
				'--destination-in-host h.o.s.t   ->  which is the target Janus IN endpoint host',
				'--destination-in-host port      ->  which is the target Janus IN endpoint port',
				'--destination-out-host h.o.s.t  ->  which is the target Janus OUT endpoint host',
				'--destination-out-port port     ->  which is the target Janus OUT endpoint port',
				'\\' + drawStarSeparator('*',columnWidth-2) + '/',
			].join("\n");
	console.log(usageExplanation);
};

function parseArgs() {
	var self = this ;
};
parseArgs.prototype = new process.EventEmitter();
parseArgs.prototype.parse = function (){
	var argvLength = process.argv.length ;
	if ((argvLength == 2) && (module.parent == null)) {
		// script is being called by using node script.js --> without any arguments
		printHelp();
		process.exit(0);
	} else if (argvLength > 2) {
		// at least one argument has been given
		parseLoop: 
		for ( var i=1 ; i<argvLength ; i++ ){
			var elem = process.argv[i];
			var next_elem = process.argv[i+1];
			var next_elem_isNotNaN = ( (Number(next_elem+1)).toString() != 'NaN' ) ;
			if ((elem.match(/^\-\-/)) && next_elem_isNotNaN )  {
				switch (elem.replace(/^\-\-/,"")){
					case "destination-in-host":
						defInHost = next_elem;
						break;	
					case "destination-in-port":
						console.log('matchin ' + "destination-in-port");
						defInPort = next_elem;
						break;										
					case "destination-out-host": 
						defOutHost = next_elem;
						break;					
					case "destination-out-port":
						defOutPort = next_elem;
						break;
					case "def":
						console.log('**Using default values**');
						break;
					case "help":
					case "h":
					default:
						printHelp();
						process.exit(0);
				};
			};
		};
	};
	this.emit('argsParsed');
};

var parser = new parseArgs();
parser.on('argsParsed',function(){
	console.log("Destination IN Host -> " + defInHost + " Destination IN Port -> " + defInPort);
	console.log("Destination OUT Host -> " + defOutHost + " Destination OUT Port -> " + defOutPort);
	tcpClientIn = net.createConnection(defInPort,defInHost);
	tcpClientOut = net.createConnection(defOutPort,defOutHost);
});
parser.parse();

// ********************
// socket tcp functions
// ********************
tcpClientIn.on('connect',function(){
	console.log('-> IN Socket connected \\o/ <-');
});
tcpClientOut.on('connect',function(socket){
	console.log('-> OUT Socket connected \\o/ <-');
});

tcpClientIn.on('data',function(bits){
	console.log('IN ->' + bits.length + ' bytes written<-');
	tcpClientIn.write(mangleBits(bits),'raw');
});
tcpClientOut.on('data',function(bits){
	console.log('OUT ->' + bits.length + ' bytes written<-');
	tcpClientOut.write(mangleBits(bits),'raw');
});

tcpClientIn.on('error',function(){
	console.log('-> IN Socket ERROR >:( <-');
});
tcpClientOut.on('error',function(){
	console.log('-> OUT Socket ERROR >:( <-');
});