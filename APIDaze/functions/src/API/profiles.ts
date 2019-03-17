import { callerProfile } from "..";
import { config } from 'firebase-functions'
import { initializeApp } from 'firebase-admin'

const session = initializeApp(config().firebase);
const db = session.firestore();

export async function getProfile(number: string): Promise<callerProfile | undefined> {

    console.log('Looking up number', number);

    let profile: callerProfile | undefined;
    const profileQuerySnap = await db.collection('users').where('phone', '==', number).get();

    console.log('found ' + profileQuerySnap.size + ' profiels for ' + number);

    profileQuerySnap.forEach(doc => {
        const data = doc.data();
        profile = {
            username: data.username,
            phoneNumber: data.phone,
            lat: data.lat,
            lng: data.lng,
            prefGender: data.preferences.gender,
            gender: data.gender,
            age: data.age,
            zip: data.zipcode,
            locName: data.locName,
        }
    })

    return profile;
}

export async function logCall(req: any, endpoint: string) {
    await db.collection('CallLogger').doc().set({
        query: req.query,
        body: req.body,
        header: req.headers,
        endpoint: endpoint
    });
}

export async function AddToQueue(number: string, uuid: string, name: string) {

    await db.collection('MatchQueue').doc().set({
        phoneNumber: number,
        uuid: uuid,
        name: name
    });
}

export async function RemoveFromQueue(number: string) {

    const userProfileQuery = await db.collection('MatchQueue').where('phoneNumber', '==', number).get();

    userProfileQuery.forEach(async doc => {
        await db.collection('MatchQueue').doc(doc.id).delete();
    })

}

export async function RemoveFromPending(number: string){
    const userProfileQuery = await db.collection('PendingMatch').where('phoneNumber', '==', number).get();

    userProfileQuery.forEach(async doc => {
        await db.collection('PendingMatch').doc(doc.id).delete();
    })

}

export interface roomRecord {
    uuid: string,
    name: string
}

export async function GetPending(number: string): Promise<roomRecord>{
    const userProfileQuery = await db.collection('PendingMatch').where('phoneNumber', '==', number).get();

    let room: roomRecord = {
        uuid: '',
        name: '',
    };

    if (userProfileQuery.size > 0){
        var data = await userProfileQuery.docs[0].data()
        room.uuid = data.room;
        room.name = data.name;
    }

    return room;
}

export async function GetQueueLength(): Promise<number> {
    const userProfileQuery = await db.collection('MatchQueue').get();
    return userProfileQuery.size;
}
