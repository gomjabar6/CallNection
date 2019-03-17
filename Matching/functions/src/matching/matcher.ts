import {initializeApp} from 'firebase-admin'
import {config} from 'firebase-functions'

const session = initializeApp(config().firebase);
const db = session.firestore();

export interface callerMatches{
    phoneNumber: string,
    score: number,
    valid: boolean,
}

export interface callerProfile{
    phoneNumber: string,
    lat: number,
    lng: number,
    prefGender: string,
    gender: string,
    age: number,
}

export async function Match(number: number): Promise<string[]>{

    console.log('Looking up number', number);

    let profile: callerProfile | undefined;
    const profileQuerySnap = await db.collection('users').where('phone', '==', number).get();
    profileQuerySnap.forEach(doc => {
        let data = doc.data();
        profile = {
            phoneNumber: data.phone,
            lat: data.lat,
            lng: data.lng,
            prefGender: data.preferences.gender,
            gender: data.gender,
            age: data.age
        }
    })

    if (!profile){
        console.error('No profile for number: ' + number);
        return [];
    }

    const callers:callerMatches[] =  [];

    console.log('looking up rest of queue')
    // Get everyone in the match queue
    const querySnap = await db.collection('MatchQueue').get();
    querySnap.forEach(doc => {
        let data = doc.data();
        if (data.phoneNumber){
            if (profile){
                if (data.phoneNumber !== profile.phoneNumber){
                    callers.push({
                        phoneNumber: data.phoneNumber,
                        score: 0,
                        valid: false
                    });
                }
            }
        }
    })

    console.log('found queue', JSON.stringify(callers));

    // Score potential matches
    callers.forEach(async caller => {
        // Lookup Profile
        const userProfileQuery = await db.collection('users').where('phone', '==', caller.phoneNumber).get();
        let prof: callerProfile | undefined; 

        userProfileQuery.forEach(doc => {
            let data = doc.data();
            prof = {
                phoneNumber: data.phone,
                lat: data.lat,
                lng: data.lng,
                prefGender: data.preferences.gender,
                gender: data.gender,
                age: data.age
            }
        })

        if (prof && profile){
            if (prof.gender === profile.prefGender && prof.prefGender === profile.gender) {
                caller.valid = true;

                const ageClose = (100 - Math.abs(prof.age - profile.age))/ 100;
                const distClose = (22000 - distance(prof.lat, prof.lng, profile.lat, profile.lng))/22000;
                caller.score = (ageClose + distClose) / 2;
            }
        }
    })

    console.log('Generated scores', JSON.stringify(callers));
    const validMatches: string[] = callers.filter(c => c.valid).sort((a,b) => b.score - a.score).map(c => c.phoneNumber);

    console.log('Match Set', JSON.stringify(validMatches));

    return validMatches;
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number, unit: "M" | "K" | "N" = "K") {
	if ((lat1 === lat2) && (lon1 === lon2)) {
		return 0;
	}
	else {
        const radlat1 = Math.PI * lat1/180;
	    const radlat2 = Math.PI * lat2/180;
		const theta = lon1-lon2;
		const radtheta = Math.PI * theta/180;
		let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}
