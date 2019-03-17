import { firestore} from '../node_modules/firebase-functions'

import rp = require('request-promise');
import { DocumentReference } from '@google-cloud/firestore';
import { Match } from './matching/matcher';

exports.MatchNewCaller = firestore.document('MatchQueue/{userId}').onCreate(async (snap, context) => {

    if (!snap) {
        return;
    }

    const newValue = snap.data();

    if (!newValue){
        return
    }

    //Get Match
    const matches = await Match(newValue.phoneNumber);
    if (matches.length > 0){

        console.log('Found Matches for: ' + newValue.phoneNumber, JSON.stringify(matches));

        // Place Call

        // Once placed, removed users from queue

        // If not placed, call next
    }


});


exports.GetLatLongUpdate = firestore.document('users/{userId}').onUpdate(async (change, context) => {

    if (!change) {
        return;
    }

    if (!change.after){
        return
    }

    
    if (!change.before && change.before == undefined){
        return
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (!newValue || !previousValue){
        return
    }

    if (newValue.zipcode != previousValue.zipcode) {
        console.log('Zip Code Changed!', newValue.zipcode);
        let zip: string = newValue.zipcode;
        zip = zip.substr(0,5);

        await updateZip(change.after.ref, zip);
    }

});

exports.GetLatLongNew = firestore.document('users/{userId}').onCreate(async (snap, context) => {

    if (!snap) {
        return;
    }

    const newValue = snap.data();

    if (!newValue){
        return
    }

    if (newValue.zipcode) {
        console.log('Zip Code Changed!', newValue.zipcode);
        let zip: string = newValue.zipcode;
        zip = zip.substr(0,5);

        await updateZip(snap.ref, zip);
    }

});

async function updateZip(doc: DocumentReference, zip: string){
    const url = 'https://www.zipcodeapi.com/rest/GaufizMLSvdzZfMvgs72U1RWprK4SZKCTKRvVYkqC2gDp1aZsoLA175LS51bQ4mn/info.json/' + zip + '/degrees'

    const _options = {
        url: url,
        method: 'GET'
    };

    let data = await rp(_options);
    data = JSON.parse(data);
    console.log('found latlong', data);

    await doc.update({
        lat: data.lat,
        lng: data.lng
    })
}