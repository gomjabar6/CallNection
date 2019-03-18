
var totalUsers = document.querySelector("#total-users")
var totalCalls = document.querySelector("#total-calls")

/* CREATE */
// create element and render cafe
db.collection("users")
  .onSnapshot(snapshot => {
    let changes = snapshot.docChanges();
    totalUsers.innerHTML = changes.length
  });


db.collection("CallLogger")
  .onSnapshot(snapshot => {
  let changes = snapshot.docChanges();
  totalCalls.innerHTML = changes.length
});