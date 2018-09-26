var express = require('express');
var nem = require('nem-sdk').default;
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
				res.send({'status' : 'error', 'message' : 'address or private key missing','data':nem.model.nodes.defaultTestnet,'dataw':nem.model.nodes.defaultPort});
			}
			var endpoint = nem.model.objects.create("endpoint")('http://23.228.67.85', 7890);
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
			var endpoint = nem.model.objects.create("endpoint")('http://23.228.67.85', 7890);
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
			var endpoint = nem.model.objects.create("endpoint")('http://23.228.67.85', 7890);
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

app.listen(3000);
