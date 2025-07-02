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
    let task, li;
    for(let i = 0; i < tasks.length; i++){
        task = tasks[i];
        li = document.createElement("li");
        li.textContent = task.text;

        if(task.completed){
            li.classList.add("checked");
        }

        li.setAttribute("data-index", i);
        li.setAttribute("tabindex", "0");

        span = document.createElement("span");
        span.innerHTML = "\u00d7"
        li.appendChild(span);

        listContainer.appendChild(li);
    }
}

loadTasks();
renderTasks();

listContainer.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        const index = e.target.getAttribute("data-index");
        tasks[index].completed = !tasks[index].completed;
        saveData();
        renderTasks();
    } else if(e.target.tagName === "SPAN"){
        const index = e.target.getAttribute("data-index");
        tasks.splice(index, 1);
        saveData();
        renderTasks();
    }
});

function saveData(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}



