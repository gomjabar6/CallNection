import { firestore} from '../node_modules/firebase-functions'

import rp = require('request-promise');
import { DocumentReference } from '@google-cloud/firestore';
import { Match, AddToPending, RemoveFromQueue, callerMatches } from './matching/matcher';

exports.MatchNewCaller = firestore.document('MatchQueue/{userId}').onCreate(async (snap, context) => {

    if (!snap) {
        return;
    }

    const newValue = snap.data();

    if (!newValue){
        return
    }

    //Get Match
    const matches: callerMatches[] = await Match(newValue.phoneNumber);
    if (matches.length > 0){

        console.log('Found Matches for: ' + newValue.phoneNumber, JSON.stringify(matches));
        
        //Add Pending Match
        await AddToPending(newValue.phoneNumber, newValue.uuid, matches[0].name);
        await AddToPending(matches[0].phoneNumber, newValue.uuid, newValue.name);

        //Remove from room
        await RemoveFromQueue(newValue.phoneNumber);
        await RemoveFromQueue(matches[0].phoneNumber)

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
    const url = 'https://www.zipcodeapi.com/rest/z3T3rFtcJKmHsWADZmy5I97VIO8MpUHkrBjI0GYfM6ZYtlaPhuwcfRcxdylNJsGl/info.json/' + zip + '/degrees'

    const _options = {
        url: url,
        method: 'GET'
    };

    let data = await rp(_options);
    data = JSON.parse(data);
    console.log('found latlong', data);

    await doc.update({
        lat: data.lat,
        lng: data.lng,
        locName: data.city
    })
}