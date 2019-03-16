import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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

    await db.collection('SMSQueue').doc().set(request.body);

});

// exports.HelloTxt = functions.firestore
//     .document('users/{userId}')
//     .onCreate((snap, context) => {
//         // Get an object representing the document
//         // e.g. {'name': 'Marie', 'age': 66}
//         const newValue = snap.data();

//         // access a particular field as you would any JS property
//         const name = newValue.name;

//         // perform desired operations ...
//     });
