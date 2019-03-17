import { https, config } from 'firebase-functions'
import { initializeApp } from 'firebase-admin'

const session = initializeApp(config().firebase);
const db = session.firestore();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const wavBeep = 'http://www.wavsource.com/snds_2018-06-03_5106726768923853/sfx/bloop_x.wav';

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

    const xmlStr = `<?xml version="1.0" encoding="utf-8"?>
    <document>
     <work>
      <answer/>
      <speak input-timeout='20000'>
        Welcome to CallNection! Press 1 to continue
        <bind action='https://us-central1-tadhacks-2019-orlando.cloudfunctions.net/apidazeGetProfile'>1</bind>
      </speak>
     </work>
    </document>`

    response.set('Content-Type', 'text/xml; charset=utf8').status(200).send(xmlStr);
});

export const apidazeGetProfile = https.onRequest(async (request, response) => {
    let callNumber: string = request.query['caller_id_number'];
    callNumber = callNumber.substr(1);

    console.log('rcv call query:', callNumber);

    let profile: callerProfile | undefined;
    try {
        if (callNumber) {
            profile = await getProfile(callNumber);
        }
    } catch {

    }

    if (!profile) {
        
        const xmlStr = `<?xml version="1.0" encoding="utf-8"?>
        <document>
         <work>
          <answer/>
          <speak>Your profile could not be found or is not complete, please send a text to this number to create a profile!</speak>
          <hangup/>
         </work>
        </document>`
    
        response.set('Content-Type', 'text/xml; charset=utf8').status(200).send(xmlStr);

    } else {
        let speakStr = 'Hello ' + profile.username + '! You are a ' + profile.age + ' year old ' + profile.gender + ' looking for a ' + profile.prefGender + ' near zipcode ' + profile.zip + '.';
        speakStr += ' Please wait while we find you a match!';

        const xmlStr = `<?xml version="1.0" encoding="utf-8"?>
        <document>
         <work>
          <answer/>
          <playback>` + wavBeep + `</playback>
          <speak>` + speakStr + `</speak>
          <wait>` + 5 + `</wait>
          <speak>Found a match! Connecting</speak>
          <wait>3</wait>
         </work>
        </document>`
    
        response.set('Content-Type', 'text/xml; charset=utf8').status(200).send(xmlStr);
    }


});

async function getProfile(number: string): Promise<callerProfile | undefined> {

    console.log('Looking up number', number);

    let profile: callerProfile | undefined;
    const profileQuerySnap = await db.collection('users').where('phone', '==', number).get();
    profileQuerySnap.forEach(doc => {
        let data = doc.data();
        profile = {
            username: data.username,
            phoneNumber: data.phone,
            lat: data.lat,
            lng: data.lng,
            prefGender: data.preferences.gender,
            gender: data.gender,
            age: data.age,
            zip: data.zipcode,
        }
    })

    return profile;
}

