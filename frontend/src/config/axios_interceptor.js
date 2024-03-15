import { API_HEADER_AUTH_KEY }  from './global_constants';
import axios 	from 'axios';
import base64 	from 'base-64';

/* Creating axios instance */
let axiosInstance = axios.create({headers: {"auth-key": API_HEADER_AUTH_KEY}});

/* Request interceptor */
axiosInstance.interceptors.request.use((request)=>{
	let encodedData	=	base64.encode(JSON.stringify(request.data));
	request.data 	=	{data: encodedData};
	return request;
},(error)=>{
	/* Do something with request error */
	return Promise.reject(error);
});

/* Response interceptor */
axiosInstance.interceptors.response.use(response=> {
	let decodedData	=	JSON.parse(base64.decode(response.data));
	response.data	= 	decodedData;
	return response;
},(error)=>{
	/* Do something with response error */
	return Promise.reject(error);
});

export default axiosInstance;