import * as requestPromise from 'request-promise';

export async function startText(number: string){

    const url = 'https://us-central1-tadhacks-2019-orlando.cloudfunctions.net/firstSMS?from=' + number

    const options = {
        uri: url
    };

    await requestPromise.get(options);
}