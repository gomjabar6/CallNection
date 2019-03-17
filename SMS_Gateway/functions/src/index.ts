import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SendSMS } from './helpers/sms-flowroute';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

export const rcvSMS = functions.https.onRequest(async (request, response) => {
    console.log(request.body);
    //response.send("Hello from Firebase!");

    await db.collection('SMSInboundQueue').doc().set(request.body);

});

// exports.HelloTxt = functions.firestore
//     .document('SMSInboundQueue/{userId}')
//     .onCreate(async (snap, context) => {
//         // Get an object representing the document
//         // e.g. {'name': 'Marie', 'age': 66}
//         const newValue = snap.data();

//         if (!newValue) {
//             return;
//         }

//         const phoneNumber = newValue.data.attributes.from;

//         var message = {
//             to: phoneNumber,
//             message: 'Welcome to CallNection! Help us learn more about you to better connect you to others. Let us know what you would like to be called. Text us your Nickname!'
//         }

//         await db.collection('SMSOutboundQueue').doc().set(message);

//     });

exports.TextSender = functions.firestore
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