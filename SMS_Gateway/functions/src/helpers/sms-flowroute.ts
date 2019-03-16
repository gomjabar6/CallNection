import { flowUsername, flowPassword } from "./flowroutecreds";

const numberId = "12258001080"
const msgURI = 'https://api.flowroute.com/v2.1/messages';
const rp = require('request-promise');

export function SendSMS(phoneNumber: string, message: string){
    const _headers = {
        'content-type': 'application/vnd.api+json',
        'accept': 'application/vnd.api+json',
    };
    
    const request_body = { 
        data: {
          type: "message",
          attributes: {
            to: phoneNumber,
            from: numberId,
            body: message,
            is_mms: "false"
          } 
        } 
      };
    
    // construct the request
    const _options = {
        url: msgURI,
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(request_body),
        auth: {
            user: flowUsername,
            password: flowPassword
        }
    };
    
    console.log('sending request', _options);
    
    rp(_options)
        .then(function (parsedBody: any) {
            // POST succeeded...
            console.log('Request success', parsedBody);
        })
        .catch(function (err: any) {
            // POST failed...
            console.error('Request Error', err);
        });
}
