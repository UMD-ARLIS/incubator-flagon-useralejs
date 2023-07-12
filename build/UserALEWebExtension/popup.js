var toggleStatus = true;
const toggleSwitch = document.getElementById("toggleSwitch");

toggleSwitch.addEventListener("change", function () {
  if (toggleSwitch.checked) {
    console.log("Checkbox is checked!");
  } else {
    console.log("Checkbox is unchecked!");
    toggleStatus = false;
  }
});
