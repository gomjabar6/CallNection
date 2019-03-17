import { https } from 'firebase-functions'
import { getProfile, logCall, AddToQueue, RemoveFromQueue, GetQueueLength, RemoveFromPending, GetPending } from './API/profiles';
import { genders } from './genders';

// const wavBeep = 'http://www.wavsource.com/snds_2018-06-03_5106726768923853/sfx/bloop_x.wav';

export interface callerProfile {
    username: string,
    phoneNumber: string,
    lat: number,
    lng: number,
    prefGender: string,
    gender: string,
    age: number,
    zip: string,
}

export const apidazeTest = https.onRequest(async (request, response) => {

    let callNumber: string = request.query['caller_id_number'];
    if (callNumber.substr(0,1) === '+'){
        callNumber = callNumber.substr(1);
    }

    await logCall(request, 'Test');
    console.log('rcv call from:', callNumber, JSON.stringify(request.query));

    let loop = 0;
    if (request.query['loop']){
        loop = Number(request.query['loop'])
    }
    
    loop++;

    let xmlStr =''

    // If they hungup, remove them.
    if (request.query['hangup_cause']){
        await RemoveFromQueue(callNumber);
        return;
    }

    if (loop === 1){
        xmlStr = `<?xml version="1.0" encoding="utf-8"?>
        <document>
         <variables>
          <loop>` + loop + `</loop>
         </variables>
         <work>
          <answer/>
          <speak>Welcome to CallNection! looking up your profile.</speak>
         </work>
        </document>`
    } else if (loop === 2) {

        let profile: callerProfile | undefined;
        try {
            if (callNumber) {
                profile = await getProfile(callNumber);
            }
        } catch {
    
        }

        if (profile){
            let speakStr = 'Hello ' + profile.username + '! You are a ' + profile.age + ' year old ' + genders[profile.gender] + ' looking for a ' + genders[profile.prefGender] + ' near zipcode ' + profile.zip + '.';
            speakStr += ' Please wait while we find you a match!';
    
            xmlStr = `<?xml version="1.0" encoding="utf-8"?>
            <document>
             <variables>
              <loop>` + loop + `</loop>
             </variables>
             <work>
              <answer/>
              <speak>` + speakStr + `</speak>
             </work>
            </document>`

            // Remove from pending if lost
            await RemoveFromPending(profile.phoneNumber);

            // Add user to queue
            await AddToQueue(profile.phoneNumber, request.query['uuid']);

        } else {
            xmlStr = `<?xml version="1.0" encoding="utf-8"?>
            <document>
             <work>
              <answer/>
              <speak>Your profile could not be found or is not complete, please send a text to this number to create a profile!</speak>
              <hangup/>
             </work>
            </document>`
        }

    } else {

        let strCount = ' there is one connection being made.'
        const numConn = await GetQueueLength();
        if (numConn > 1){
            strCount = ' there are ' + numConn + ' connections being made.'
        }

        // Check if pending room swith
        const room = await GetPending(callNumber);
        if (room !== ''){
            xmlStr = `<?xml version="1.0" encoding="utf-8"?>
            <document>
             <work>
                <speak>Your CallNection was found! Please wait while I connect you.</speak>
                <conference>` + room + `</conference>
             </work>
            </document>`

            // cleanup pending list
            await RemoveFromPending(callNumber);
        } else {
            // If we are here we should be trying to match the user
            xmlStr = `<?xml version="1.0" encoding="utf-8"?>
            <document>
            <variables>
            <loop>` + loop + `</loop>
            </variables>
            <work>
            <answer/>
            <wait>15</wait>
            <speak>Still looking for your perfect CallNection,` + strCount + `</speak>
            </work>
            </document>`
        }


    }

    response.set('Content-Type', 'text/xml; charset=utf8').status(200).send(xmlStr);
});


