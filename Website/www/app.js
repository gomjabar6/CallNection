const cafeList = document.querySelector("#cafe-list");
const form = document.querySelector("#add-cafe-form");

function renderCafe(doc) {
    let li = document.createElement("li");
    let name = document.createElement("span");
    let city = document.createElement("span");
    let cross = document.createElement("div");
  
    li.setAttribute("data-id", doc.id); // sets uuid
    name.textContent = doc.data().name;
    city.textContent = doc.data().city;
  
    li.appendChild(name);
    li.appendChild(city);
    li.appendChild(cross); // This "X" is the delete button
  
    cafeList.appendChild(li);
  
    // deleting data
    cross.addEventListener("click", e => {
      e.stopPropagation(); // optional
      let id = e.target.parentElement.getAttribute("data-id");
      db.collection("cafes")
        .doc(id)
        .delete();
    });
  }

/* CREATE */
// create element and render cafe
db.collection("cafes")
  .orderBy("city")
  .onSnapshot(snapshot => {
    let changes = snapshot.docChanges();
    changes.forEach(change => {
      if (change.type == "added") {
        renderCafe(change.doc);
      } else if (change.type == "removed") {
        let li = cafeList.querySelector("[data-id=" + change.doc.id + "]");
        cafeList.removedChild(li);
      }
    });
  });

  /* saving data */
form.addEventListener("submit", e => {
    e.preventDefault();
    db.collection("cafes").add({
      name: form.name.value,
      city: form.city.value
    });
    form.name.value = "";
    form.city.value = "";
  });