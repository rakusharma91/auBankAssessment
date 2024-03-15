import axios from "axios";
import axiosInstance from './../config/axios_interceptor.js';
import { API_URL, STATUS_ERROR }  from '../config/global_constants';
import { createIntl } from "react-intl";

export async function callBackendAPI(request){
    let response 	=   await axios.all(request.map(params => axiosInstance.post( API_URL+'api/'+ params.path, params)));
    let errorFlag	=   false;
    let errorRecord =   [];
    let apiResponse =   response.map( el => {
        let responseData = el.data;
        if(responseData.status === STATUS_ERROR){
            errorFlag	= true;
            errorRecord = (responseData.message) ? responseData.message : [];
        }
        return responseData;
    });
    return {success: !errorFlag, data: apiResponse};
}// end callBackendAPI()

/* format the number/price in required format */
const intl = createIntl({ locale: "en"});
export function currencyFormat(amount, currency = "USD"){
	return intl.formatNumber(amount , {style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 2});
};// end currencyFormat()