var express = require('express');
var nem = require('nem-sdk').default;
var crypto = require('crypto');
var bodyParser = require('body-parser')
var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
	app.post('/sendMoney', function(req, res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (ip.substr(0, 7) == "::ffff:") {
  			ip = ip.substr(7)
		}
		if(ip=='127.0.0.1'){
			var address = req.body.address;
			var privkey = req.body.privkey;
			
			if(!address || !privkey){
				res.send({'status' : 'error', 'message' : 'address or private key missing'});
			}
			var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, 7890);
			var common = nem.model.objects.create("common")("", privkey);
			var transferTransaction = nem.model.objects.create("transferTransaction")(address, 1, "NEM");
			var transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.testnet.id);
			nem.model.transactions.send(common, transactionEntity, endpoint).then(function(response){
				res.send(response);
			});
		}
		else{
			res.send({'status' : 'error','message':'Unauthorized Request'});
		}
	});
	app.post('/addressCheck', function(req, res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (ip.substr(0, 7) == "::ffff:") {
			ip = ip.substr(7)
		}
		if(ip=='127.0.0.1'){
			var address = req.body.address;
			if(!address){
				res.send({'status' : 'error', 'message' : 'address missing'});
			}
			var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, 7890);
			var isValid = nem.model.address.isValid(address);
			res.send({'isValid':isValid});
		}
		else{
			res.send({'status' : 'error','message':'Unauthorized Request'+ip});
		}
	});
	app.post('/addressGet', function(req, res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (ip.substr(0, 7) == "::ffff:") {
  			ip = ip.substr(7)
		}
		if(ip=='127.0.0.1'){
			var address = req.body.address;
			if(!address){
				res.send({'status' : 'error', 'message' : 'address missing'});
			}
			var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, 7890);
			var isValid = nem.com.requests.account.data(endpoint, address).then(function(responsed) {
				res.send({'status':true,'data':responsed});
			}, function(err) {
				res.send({'status':false,'message':err});
			});
		}
		else{
			res.send({'status' : 'error','message':'Unauthorized Request'+ip});
		}
	});
	var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, nem.model.nodes.websocketPort);
	// Address to subscribe
	var address = "TAWVYOMO5H4IDYTRWSYZQMZ6TLIYSBXPUWU3HXTX";
	// Create a connector object
	var connector = nem.com.websockets.connector.create(endpoint, address);
	var request = require('request');
	// Connect using connector
	connector.connect().then(function() {
		// If we are here we are connected
		console.log("Connected");
		nem.com.websockets.subscribe.account.data(connector, function(res) {
			var data1 = JSON.stringify(res);
			var data1 = JSON.parse(data1);
			console.log(data1.meta.status);
		});
		nem.com.websockets.subscribe.account.transactions.unconfirmed(connector, function(res) {
			var data1 = JSON.stringify(res);
			var data1 = JSON.parse(data1);
			if (typeof data1.transaction.message.payload == 'undefined'){
				var mssg = 'undefined';
			}
			else{
				var hex = data1.transaction.message.payload,bytes = [],str;
				for(var i=0; i< hex.length-1; i+=2){
					bytes.push(parseInt(hex.substr(i, 2), 16));
				}
				str = String.fromCharCode.apply(String, bytes);
				var mssg = str;
			}
			var data_post = [{'coin':'BTC','broker_id':2,'address':data1.transaction.recipient,'category':'receive','amount':data1.transaction.amount/1000000,'confirmations':0,'txid':data1.meta.hash.data,'message':mssg}];
			if(data1.transaction.recipient == address){
				request.post(
				'https://sys.pixiubit.com/api/receive_deposits',
				{
					json: {
						'coin':'BTC',
						'coinid':1,
						'broker_id':2,
						'api_key':crypto.createHash('md5').update('access_send_deposits_2').digest("hex"),
						'data_deposits':JSON.stringify(data_post)
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body)
					}
					else{
						console.log(error)
						console.log(response)
					}
				})
			}
			console.log(JSON.stringify(data_post));
		});
		nem.com.websockets.subscribe.account.transactions.confirmed(connector, function(res) {
			var data1 = JSON.stringify(res);
			var data1 = JSON.parse(data1);
			if (typeof data1.transaction.message.payload == 'undefined'){
				var mssg = 'undefined';
			}
			else{
				var hex = data1.transaction.message.payload,bytes = [],str;
				for(var i=0; i< hex.length-1; i+=2){
					bytes.push(parseInt(hex.substr(i, 2), 16));
				}
				str = String.fromCharCode.apply(String, bytes);
				var mssg = str;
			}
			var data_post = [{'coin':'BTC','broker_id':2,'address':data1.transaction.recipient,'category':'receive','amount':data1.transaction.amount/1000000,'confirmations':2,'txid':data1.meta.hash.data,'message':mssg}];
			if(data1.transaction.recipient == address){
				request.post(
				'https://sys.pixiubit.com/api/receive_deposits',
				{
					json: {
						'coin':'BTC',
						'coinid':1,
						'broker_id':2,
						'api_key':crypto.createHash('md5').update('access_send_deposits_2').digest("hex"),
						'data_deposits':JSON.stringify(data_post)
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body)
					}
					else{
						console.log(error)
						console.log(response)
					}
				})
			}
			console.log(JSON.stringify(data_post));
		});
		// Request account data
		nem.com.websockets.requests.account.data(connector);
	}, function (err) {
		// If we are here connection failed 10 times (1/s).
		console.log(err);
	});

app.listen(3000);
