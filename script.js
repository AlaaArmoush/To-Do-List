const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

let tasks = [];

function addTask(){
    if(inputBox.value.trim() === ""){
        alert("You have to write something first!");
    }else{
        tasks.push({
            text: inputBox.value.trim(),
            completed: false
        });
        inputBox.value = "";
        saveData();
        renderTasks();
    }
}

inputBox.addEventListener("keypress", function(event){
    if(event.key === "Enter"){
        addTask();
    }
});

function loadTasks(){
    const storedTasks = localStorage.getItem("tasks");
    if(storedTasks){
        tasks = JSON.parse(storedTasks);
    }else{
        tasks = [];
    }
}

function renderTasks(){
    listContainer.innerHTML = "";
    let task, li, checkSpan, textNode, delSpan;
    for(let i = 0; i < tasks.length; i++){
        task = tasks[i];
        li = document.createElement("li");

        checkSpan = document.createElement("span");
        checkSpan.className = "check-circle";
        li.appendChild(checkSpan);
        
        textNode = document.createTextNode(task.text);
        li.appendChild(textNode);

        delSpan = document.createElement("span");
        delSpan.className = "close";
        delSpan.innerHTML = "\u00d7";
        li.appendChild(delSpan);

        if(task.completed){
            li.classList.add("checked");
        }

        li.setAttribute("data-index", i);
        li.setAttribute("tabindex", 0);

        listContainer.appendChild(li);
    }
}

function saveData(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

loadTasks();
renderTasks();


listContainer.addEventListener("click", function(e) {
  const li = e.target.closest("li[data-index]");
  if (!li) return;
  
  const index = li.getAttribute("data-index");

  if (e.target.classList.contains("check-circle")) {
    tasks[index].completed = !tasks[index].completed;
  } else if (e.target.classList.contains("close")) {
    tasks.splice(index, 1);
  } else {
    if (!e.target.classList.contains("check-circle") && !e.target.classList.contains("close")) {
      editTask(index, li);
      return; 
    }
  }
  
  saveData();
  renderTasks();
});

function editTask(index, li){
    let input = document.createElement("input");
    input.type = "text";
    input.value = tasks[index].text;
    input.className = "edit-input";

    li.textContent = "";
    li.appendChild(input);
    input.focus();

    let span = document.createElement("span");
    span.innerHTML = "\u00d7";
    li.appendChild(span);
    
    input.addEventListener("keydown", function(e){
        if(e.key === "Escape"){
            renderTasks();
        }
    });

    input.addEventListener("keypress", function(e){
        if(e.key === "Enter"){
            saveEdit();
        }
    });

    input.addEventListener("blur", function(){
        saveEdit();
    });

    function saveEdit(){
        let edit = input.value.trim();
        if(edit === ""){
            alert("Task cannot be empty!");
            input.focus();
            return;
        }

        tasks[index].text = edit;
        saveData();
        renderTasks();
    }
}



