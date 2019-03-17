import * as requestPromise from 'request-promise';

const apiSec = 'c5d20f37c2e3de1cbb767eb4db2aedf2';
const apiKey = 'c4ed1f72';

export async function transfer(uuid: string){

    const url = 'https://api.apidaze.io/' + apiKey + '/calls/' + uuid + '?api_secret=' + apiSec;

    const body = {
        url: 'https://us-central1-tadhacks-2019-orlando.cloudfunctions.net/apidazeJoinRoom'
    }

    const options = {
        uri: url,
        body: JSON.stringify(body)
    };

    const data = await requestPromise.get(options);
    console.log('API Data', data, url);

    return data;

}

export async function getCallList(){
    
    const url = 'https://api.apidaze.io/' + apiKey + '/calls?api_secret=' + apiSec;

    const options = {
        uri: url
    };

    const data = await requestPromise.get(options);
    console.log('API Data', data, url);

    return data;

}

export async function getCallDetails(uuid: string){
    
    const url = 'https://api.apidaze.io/' + apiKey + '/calls/' + uuid + '?api_secret=' + apiSec;

    const options = {
        uri: url
    };

    try {
        const data = await requestPromise.get(options);
        console.log('Call Data', data, url);
    
        return data;
    } catch {
        return;
    }

}
