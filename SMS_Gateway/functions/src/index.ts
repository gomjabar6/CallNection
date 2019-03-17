import { SendSMS } from './helpers/sms-flowroute';
import {https, config, firestore} from 'firebase-functions';
import {initializeApp} from 'firebase-admin'
import { SMSReceipt } from './models/sms';

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

    // Look for exisitng
    const id = request.body.data.id;
    const query = await db.collection('SMSInboundQueue').where('data.id', '==', id).get();

    if (query.size == 0){
        await db.collection('SMSInboundQueue').doc().set(request.body);
    }

});

export const firstSMS = https.onRequest(async (request, response) => {
    
    const number = request.query['from'];
    if (number) {
        const newSMS: SMSReceipt = {
            data: {
                attributes: {
                    amount_display: '',
                    amount_nanodollars: '',
                    body: 'hello',
                    direction: 'inbound',
                    from: request.query['from'],
                    is_mms: false,
                    message_callback_url: '',
                    message_encoding: 0,
                    status: 'delivered',
                    timestamp: '',
                    to: '12258001080',
                },
                id: 'autoGen',
                type: 'message',
            }
        }

        await db.collection('SMSInboundQueue').doc().set(newSMS);
        response.send('Text Sent!');
    }

    return;

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