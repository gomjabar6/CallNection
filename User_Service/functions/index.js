const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const USER_STATE = Object.freeze({
  UNREGISTERED: "unregistered",
  ONBOARD_USERNAME: "onboard_username",
  ONBOARD_GENDER: "onboard_gender",
  ONBOARD_AGE: "onboard_age",
  ONBOARD_ZIPCODE: "onboard_zipcode",
  ONBOARD_ORIENTATION: "onboard_orientation",
  ONBOARD_COMPLETE: "onboard_complete",
  CEASE_CONTACT: "cease_contact"
});

const checkIfProfileExistsByPhoneNumber = phone_number => {
  return db
    .collection("users")
    .where("phone", "==", phone_number)
    .get()
    .then(snapshot => {
      const bag = [];
      snapshot.forEach(doc => {
        bag.push(doc.data());
      });
      return bag.length === 0 ? true : false;
    });
};

exports.testHook = functions.https.onRequest(async (req, res) => {
  const user = await loadOrCreateUser("3247487199");

  res.json(user);
});

exports.monitorSMSInboundQueue = functions.firestore
  .document("SMSInboundQueue/{smsId}")
  .onWrite(async (change, context) => {
    const data = change.after.data();

    const phone = data.data.attributes.from;

    const text = data.data.attributes.body;

    handleSms({ text, phone });
  });

const handleSTOP = (text, phone) => {
  db.collection("SMSOutboundQueue").add({
    message: `Service will STOP sending messages to you now. Good Bye! `,
    to: phone
  });

  userUpdateState(phone, {
    state: USER_STATE.CEASE_CONTACT
  });
};

const handleSms = async ({ text, phone }) => {
  const user = await loadOrCreateUser(phone);

  if (text === "STOP") {
    handleSTOP(text, phone);
    return;
  }
  console.log(user, "this is the user status");
  switch (user.state) {
    case USER_STATE.UNREGISTERED:
      sendInitialMessage(phone, text);
      break;
    case USER_STATE.ONBOARD_USERNAME:
      addUsername(phone, text);
      break;
    case USER_STATE.ONBOARD_AGE:
      addAge(phone, text);
      break;
    case USER_STATE.ONBOARD_GENDER:
      addGender(phone, text);
      break;
    case USER_STATE.ONBOARD_ZIPCODE:
      addZipcode(phone, text);
      break;
    case USER_STATE.ONBOARD_ORIENTATION:
      addOrientation(phone, text);
      break;
    case USER_STATE.ONBOARD_COMPLETE:
      handleQuestion(phone, text);
      break;
    default:
      sendError(phone);
      break;
  }
};

const handleQuestion = (phone, text) => {
  db.collection("SMSOutboundQueue").add({
    message: `You are now ready to match with other people. Just call us whenever you are ready!`,
    to: phone
  });
};

const addOrientation = (phone, text) => {
  console.log(text);

  if (text.length === 1) {
    db.collection("SMSOutboundQueue").add({
      message: `${text} was your preference. Your account is now complete. You can now call the service at any time. Good Luck`,
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_COMPLETE,
      preferences: {
        gender: text.trim()
      }
    });
  }
};

const addZipcode = (phone, text) => {
  console.log(text);

  if (text.length > 1) {
    db.collection("SMSOutboundQueue").add({
      message: `${text} is your zipcode. Now tell us who you want to match up with. Text M for male, F for female, O for other!`,
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_ORIENTATION,
      zipcode: text.trim()
    });
  }
};

const addGender = (phone, text) => {
  console.log(text);

  if (text.length === 1) {
    db.collection("SMSOutboundQueue").add({
      message: `${text} is your gender. Now tell us your zipcode so we can connect you with local people!`,
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_ZIPCODE,
      gender: text.trim()
    });
  }
};

const addAge = (phone, text) => {
  console.log(text);
  if (text.length > 1) {
    db.collection("SMSOutboundQueue").add({
      message: `${text} is now your age. Now tell us your gender. Text M for male, F for female, O for other! `,
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_GENDER,
      age: text.trim()
    });
  }
};

const addUsername = (phone, text) => {
  console.log(text);
  if (text.length > 3) {
    db.collection("SMSOutboundQueue").add({
      message: `${text} is now your username. Next step is text us your age!`,
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_AGE,
      username: text.trim()
    });
  }
};

const sendInitialMessage = (phone, text) => {
  console.log(text);
  if (text.toLocaleLowerCase() === "START".toLocaleLowerCase()) {
    db.collection("SMSOutboundQueue").add({
      message:
        "Welcome to CallNection! Help us learn more about you to better connect you to others. Let us know what you would like to be called. Text us your Nickname! Remember you can text STOP at any time to cancel the service.",
      to: phone
    });

    userUpdateState(phone, {
      state: USER_STATE.ONBOARD_USERNAME
    });
  } else {
    db.collection("SMSOutboundQueue").add({
      message:
        "Welcome to CallNection! Text START to get started! Message and Data Rates May Apply.",
      to: phone
    });
  }
};

const userUpdateState = async (phone, state) => {
  let user = await db
    .collection("users")
    .where("phone", "==", phone)
    .get();

  user.forEach(doc => {
    console.log(doc.id, "THis is the user id");
    db.collection("users")
      .doc(doc.id)
      .update(state);
  });
};

const loadOrCreateUser = async phone => {
  const bag = [];

  let user = await db
    .collection("users")
    .where("phone", "==", phone)
    .limit(1)
    .get();

  user.forEach(doc => {
    bag.push(doc.data());
  });

  if (bag.length === 0) {
    user = await db.collection("users").add({
      phone,
      age: "",
      gender: "",
      username: "",
      zipcode: "",
      preferences: {
        gender: ""
      },
      state: USER_STATE.UNREGISTERED
    });
    user = await db
      .collection("users")
      .doc(user.id)
      .get();
    bag.push(user.data());
  }

  return bag[0];
};

const sendError = phone => {
  db.collection("SMSOutboundQueue").add({
    message: `I'm sorry. I could not read that. Please try again.`,
    to: phone
  });
};
