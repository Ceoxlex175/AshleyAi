import ai_contract from "https://raw.github.com/Ceoxlex175/AshleyAi/ai_contract"

let Datcon = fetch("https://raw.github.com/Ceoxlex175/AshleyAi/ai_contract.txt");
function autosave() {
  localStorsge.setItem("ContractDATA", Datcon);
  if (localStorsge.getItem("ContractData", Datcon) === localStorsge.getItem("ContractData", Datcon)){
    console.log("saved!");
  }
  else {
    console.log("Error accour");
  }
  
}
function update() {
  console.log(fetch("https://raw.github.com/Ceoxlex175/AshleyAi/ai_contract.txt"));
}
