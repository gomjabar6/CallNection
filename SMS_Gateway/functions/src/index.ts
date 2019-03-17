import { SendSMS } from './helpers/sms-flowroute';
import {https, config, firestore} from 'firebase-functions';
import {initializeApp} from 'firebase-admin'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const session = initializeApp(config().firebase);
const db = session.firestore();

export const rcvSMS = https.onRequest(async (request, response) => {
    console.log(request.body);
    //response.send("Hello from Firebase!");

    await db.collection('SMSInboundQueue').doc().set(request.body);

});

exports.TextSender = firestore
    .document('SMSOutboundQueue/{userId}')
    .onCreate((snap, context) => {
        // Get an object representing the document
        // e.g. {'name': 'Marie', 'age': 66}
        const newValue = snap.data();

        if (!newValue) {
            return;
        }

        const phoneNumber = newValue.to;
        const message = newValue.message;

        SendSMS(phoneNumber, message);
    });