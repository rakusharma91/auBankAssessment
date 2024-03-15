/** Node express */
const express	= 	require('express');
const app 		=	express();
const cors 		=	require('cors');
const moment 	=	require('moment');
const base64	= 	require('base-64');
const utf8		=	require('utf8');
 
app.use(cors());

/** Constant */
const NOT_ALLOWED_TAGS_XSS = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*/gi];
const STATUS_SUCCESS 	=	"success";
const STATUS_ERROR 		= 	"error";

/**  including .env file */
let envFileName = ".env";
require('dotenv').config({path : __dirname+"/"+envFileName});

/** bodyParser for node js */
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
	extended: true,
	limit	: '50mb',
    parameterLimit : 1000000
}));
app.use(bodyParser.json());

server = app.listen(process.env.PORT,()=>{
	server.timeout = parseInt(process.env.MAX_EXECUTION_TIME);	
    console.log('Server listening on port ' + process.env.PORT+" Time- "+new Date());
});

/** Function to track node warning **/
process.on('warning', (warning) => {
	console.error("warning stacktrace - " + warning.stack)
});

/** Function to get unhandled errors and prevent to stop nodejs server **/
process.on("uncaughtException", function (err) {
	console.error("error name ---------"+err.name);    // Print the error name
	console.error("error date ---------"+new Date());    // Print the error name
	console.error("error message ---------"+err.message); // Print the error message
	console.error("error stack ---------"+err.stack);   // Print the stack trace	
});

app.get('/', function (req, res) {
	res.send('Node Started');
});

/**
 * function use to read sales json file and send read data
 * 
 * @param req	As Request Data
 * @param res	As Response Data
 * @param next	As Callback argument to the middleware function
 *  
 * @returns json
 */
function getFileData (req, res, next){
	return new Promise(resolve=>{
		const fs = require('fs');
		fs.readFile('sales.json', 'utf8', function (err, data) {
			if (err) throw err;

			return resolve(JSON.parse(data));
		});
	}).catch(next);
}// end getFileData()

/**
 * function use to sort an array
 * 
 * @param arrayList	As array of data
 * @param key	As array key name
 *  
 * @returns sorted array list
 */
function sortArray(arrayList,key, sortDir= "asc"){
	if(!arrayList || !arrayList.length || !key) return [];

	arrayList.sort((a, b) => {
		const aVal = a[key] > 0 ? round(a[key]) : a[key];
		const bVal = b[key] > 0 ? round(b[key]) : b[key];
	
		if (aVal > bVal) return sortDir == "asc" && 1 || -1;
		if (aVal < bVal) return sortDir == "asc" && -1 || 1;
		return 0;
	});
	return arrayList;
}// end sortArray()

function round(value, precision=2){
	let multiplier = Math.pow(10, precision || 0);
	return Math.round(value * multiplier) / multiplier;
}

app.get('/',(req, res, next)=>{
	res.send('Node Running');
});

app.get('/get-data', async (req, res, next)=>{
	let data = await getFileData(req, res, next);
	res.send(data);
});

app.post('/api/get-states',authenticateRequest, async (req, res, next)=>{
	let fileData = await getFileData(req, res, next);
	let stateList = {};
	if(fileData && fileData.length){
		fileData.forEach(records => {
			if(records.State && !stateList[records.State]) stateList[records.State] = {value: records.State, label: records.State};
		});
	}
	let fList = Object.values(stateList);
	sendApiResponse(req, res, next, {status: STATUS_SUCCESS,result: fList && fList.length && sortArray(fList, "value") || []});
});

app.post('/api/get-state-stats',authenticateRequest, async (req, res, next)=>{
	let dateFormat 		=	"YYYY-MM-DD";
	let stateName 		= 	req.body.state || "";
	let startDate 		= 	req.body.startDate && moment(req.body.startDate).format(dateFormat) || "";
	let endDate 		= 	req.body.endDate && moment(req.body.endDate).format(dateFormat) || "";
	let fileData 		=	await getFileData(req, res, next);
	let stats 			=	{};
	let listSumArray 	=	["City","Product Name","Category","Sub-Category","Segment"];
	let sumList 		=	["Sales","Quantity","Discount","Profit"];

	/** Send response */
	if(!stateName) return sendApiResponse(req, res, next, {status: STATUS_SUCCESS,result: {} });

	if(fileData && fileData.length){
		fileData.forEach(records => {
			if(records.State && records.State == stateName){
				let tmpSales =	records["Sales"] || 0;
				let odDate	 =	records["Order Date"] &&  moment(records["Order Date"]).format(dateFormat) || "";
				let isValid  =	true;

				if(odDate){
					if(startDate && odDate < startDate) isValid = false;
					if(endDate && odDate > startDate) isValid = false;
				}

				if(isValid){
					listSumArray.forEach(tmpKey=>{
						if(records[tmpKey]){
							let tmpVal 	 = 	records[tmpKey];
							let listName =	tmpKey.replace(" ","").replace("-",'').toLowerCase() ;
							
							if(!stats[listName]) stats[listName] = {};
							if(stats[listName][tmpVal]) stats[listName][tmpVal].sales += tmpSales;
							if(!stats[listName][tmpVal]) stats[listName][tmpVal] = {id: tmpVal, sales: tmpSales };
						}
					});

					sumList.forEach(tmpKey=>{
						if(records[tmpKey]){
							let tmpVal 	 = 	records[tmpKey];
							let listName =	tmpKey.replace(" ","").replace("-",'').toLowerCase() ;
							
							if(!stats[listName]) stats[listName] = 0;	
							stats[listName] = stats[listName] && stats[listName]+tmpVal || tmpVal;
						}
					});	
				}
			}
		});

		/** Sort and round */
		listSumArray.forEach(tmpKey=>{
			let listName =	tmpKey.replace(" ","").replace("-",'').toLowerCase() ;
			if(stats[listName] ){
				stats[listName] = sortArray(Object.values(stats[listName]), "sales",'desc');

				stats[listName].map(records=>{
					if(records.sales) records.sales = round(records.sales);
				})
			}
		});

		if(stats.subcategory && stats.subcategory.length) stats.subcategory = stats.subcategory.slice(0, 8)
		if(stats.productname && stats.productname.length) stats.productname = stats.productname.slice(0, 7)

		/** round */
		sumList.forEach(tmpKey=>{
			let listName =	tmpKey.replace(" ","").replace("-",'').toLowerCase() ;
			if(stats[listName] ) stats[listName] = round(stats[listName]);
		});
	}
	sendApiResponse(req, res, next, {status: STATUS_SUCCESS,result: stats });
});

/** After Filter */
app.use(( req, res, next )=>{
	if(req.route && req.route.path && req.route.path.indexOf('/api/') > -1){
		/** Send response **/
		let result =  res.result;
		if(!result.status) result.status = STATUS_SUCCESS;		

		let bytes	=	utf8.encode(JSON.stringify(result));
		let encoded =	base64.encode(bytes);
		res.send(encoded);
	}else{
		res.send(res.result);
	}
	next();
});

/** Error Handling */
app.use(function (err,req,res,next) {
	if(err.stack){
		console.error(err.stack);
	}else{
		console.error(err);
	}
	return res.send({status: "error", message:'Something went wrong, Please try again.' });	
});


/**
 *  Function to authenticate request (middleware)
 *
 * @param req   As Request Data
 * @param res   As Response Data
 * @param next  As Callback argument to the middleware function
 *
 * @return response
 */
function authenticateRequest(req,res,next){
	let invalidAccessRes = base64.encode(utf8.encode(JSON.stringify({status: STATUS_ERROR, message: 'Invalid access.' })));

	try{
		/** Send error response */
		if(!req.headers["auth-key"] || req.headers["auth-key"] != process.env.API_HEADER_AUTH_KEY || !req.body || !req.body.data){
			return res.send(invalidAccessRes);
		}

		/** Decode request data */
		let decoded =	base64.decode(req.body.data);
		req.body	=	JSON.parse(utf8.decode(decoded));

		/** Sanitize Data **/
		req.body = sanitizeData(req.body,NOT_ALLOWED_TAGS_XSS);

		next();
	}catch(e){
		console.error('authenticateRequest - catch',e);
		return res.send(invalidAccessRes);
	}
}// end authenticateRequest()

/**
 * Function for sanitize form data
 *
 * @param data				As Request Body
 * @param notAllowedTags	As Array of not allowed tags
 *
 * @return json
 */
sanitizeData = (data,notAllowedTags)=>{
	let sanitized = arrayStripTags(data,notAllowedTags);
	return sanitized;
}//End sanitizeData()

/**
 * Function to strip not allowed tags from array
 *
 * @param array				As Data Array
 * @param notAllowedTags	As Tags to be removed
 *
 * @return array
 */
arrayStripTags = (array,notAllowedTags)=>{
	let result = (array.constructor === Object) ? {} :[];
	for(let key in array){
		let value = (array[key] != null) ? array[key] : '';
		if(value.constructor === Array || value.constructor === Object) {
			result[key] = arrayStripTags(value,notAllowedTags);
		}else{
			result[key] = stripHtml(value.toString().trim(),notAllowedTags);
		}
	}
	return result;
}//End arrayStripTags()

/**
 * Function to Remove Unwanted tags from html
 *
 * @param html				As Html Code
 * @param notAllowedTags	As Tags to be removed
 *
 * @return html
 */
stripHtml = (html,notAllowedTags)=>{
	let unwantedTags= notAllowedTags;
	for(let j = 0;j < unwantedTags.length;j++){
		html = html.replace(unwantedTags[j],'');
	}
	return html;
}//end stripHtml();

/**
 * function use to send api response in after filter
 * 
 * @param req	As Request Data
 * @param res	As Response Data
 * @param next	As Callback argument to the middleware function
 *  
 * @returns json
 */
sendApiResponse = (req,res,next,apiRes)=>{
	res.result = apiRes;
	next();
}//end sendApiResponse();
