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
			var amount = req.body.amount;
			
			if(!address || !privkey || !amount){
				res.send({'status' :false, 'message':'Fields Missing'});
			}
			var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, 7890);
			var privkeys = Buffer.from(privkey, 'base64').toString('ascii')
			var pIsValid = nem.utils.helpers.isPrivateKeyValid(privkeys);
			var isValid = nem.model.address.isValid(address);
			if(pIsValid == false || isValid == false){
				res.send({"status":false,"message":"Invalid Address/Private Key"});
			}
			else{
				var common = nem.model.objects.create("common")("", privkeys);
				var transferTransaction = nem.model.objects.create("transferTransaction")(address,amount, "NEM");
				var transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.testnet.id);
				nem.model.transactions.send(common, transactionEntity, endpoint).then(function(response){
					var with_data = JSON.stringify(response);
					var with_data = JSON.parse(with_data);
					if (typeof with_data.message == 'undefined'){
						res.send({'status':false,'message':'undefined'});
					}
					else{
						if(with_data.message == 'SUCCESS'){
							res.send({"status":true,"txid":with_data.transactionHash.data});
						}
						else{
							res.send({"status":false,"message":with_data.message});
						}
					}
				});
			}
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
				var acc_data = JSON.stringify(responsed);
				var acc_data = JSON.parse(acc_data);
				if (typeof acc_data.account.balance == 'undefined'){
					res.send({'status':false,'message':'undefined'});
				}
				else{
					res.send({'status':true,'amount':acc_data.account.balance/1000000});
					//res.send({'status':true,'amount':responsed});
				}
			}, function(err) {
				res.send({'status':false,'message':err});
			});
		}
		else{
			res.send({'status' : 'error','message':'Unauthorized Request'+ip});
		}
	});
	app.post('/addressIncoming', function(req, res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (ip.substr(0, 7) == "::ffff:") {
  			ip = ip.substr(7)
		}
		if(ip=='127.0.0.1'){
			var address = req.body.address;
			var blockHeight = req.body.blockHeight;
			if(!address){
				res.send({'status' : 'error', 'message' : 'address missing'});
			}
			var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, 7890);
			var isValid = nem.com.requests.account.transactions.incoming(endpoint, address,"5f846e03c6b89ae93b1eaecd29872e48839b8ecc86e4f8ca46fcffc026e367b6").then(function(responsed) {
				var acc_data = JSON.stringify(responsed);
				var acc_data = JSON.parse(acc_data);
				var i =0;
				var make_data = {};
				while(acc_data.data[i].meta.id >= 316100){
					make_data[i] = {'txid':acc_data.data[i].meta.hash.data,'block_height':acc_data.data[i].meta.id};
					i++;
				}
				res.send({'status':true,'message':make_data});
			}, function(err) {
				res.send({'status':false,'message':err});
			});
		}
		else{
			res.send({'status' : 'error','message':'Unauthorized Request'+ip});
		}
	});
	var endpoint = nem.model.objects.create("endpoint")("http://50.3.87.123", nem.model.nodes.websocketPort);
	// Address to subscribe
	var address = "TAWVYOMO5H4IDYTRWSYZQMZ6TLIYSBXPUWU3HXTX" ;
	// Create a connector object
	var connector = nem.com.websockets.connector.create(endpoint, address);
	var request = require('request');
	// Connect using connector
	connector.connect().then(function(response) {
		// If we are here we are connected
		console.log("Connected"+response);
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
			var data_post = [{'coin':'NEMT','broker_id':2,'address':data1.transaction.recipient,'category':'receive','amount':data1.transaction.amount/1000000,'confirmations':0,'txid':data1.meta.hash.data,'message':mssg}];
			if(data1.transaction.recipient == address){
				request.post(
				'https://sys.pixiubit.com/api/receive_deposits',
				{
					json: {
						'coin':'NEMT',
						'coinid':7,
						'broker_id':2,
						'api_key':crypto.createHash('md5').update('access_send_deposits_2').digest("hex"),
						'data_deposits':JSON.stringify(data_post)
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(JSON.stringify(body))
					}
					else{
						//console.log(error)
						console.log(JSON.stringify(response))
					}
				})
			}
			//console.log(JSON.stringify(data_post));
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
			var data_post = [{'coin':'NEMT','broker_id':2,'address':data1.transaction.recipient,'category':'receive','amount':data1.transaction.amount/1000000,'confirmations':2,'txid':data1.meta.hash.data,'message':mssg}];
			if(data1.transaction.recipient == address){
				request.post(
				'https://sys.pixiubit.com/api/receive_deposits',
				{
					json: {
						'coin':'NEMT',
						'coinid':7,
						'broker_id':2,
						'api_key':crypto.createHash('md5').update('access_send_deposits_2').digest("hex"),
						'data_deposits':JSON.stringify(data_post)
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var body = JSON.stringify(body);
						var body = JSON.parse(body);
						console.log(body);
					}
					else{
						//console.log(error)
						console.log(JSON.stringify(response))
					}
				})
			}
			//console.log(JSON.stringify(data_post));
		});
		// Request account data
		nem.com.websockets.requests.account.data(connector);
	}, function (err) {
		// If we are here connection failed 10 times (1/s).
		console.log(err);
	});

app.listen(3000);
