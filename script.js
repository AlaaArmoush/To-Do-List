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

let draggedIndex = -1;

function renderTasks(){
    listContainer.innerHTML = "";
    let task, li, checkSpan, textNode, delSpan;
    for(let i = 0; i < tasks.length; i++){
        task = tasks[i];
        li = document.createElement("li");

        li.draggable = true;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

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

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.getAttribute('data-index'));
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetIndex = parseInt(e.currentTarget.getAttribute('data-index'));
    if (targetIndex === draggedIndex) return;

    const listItems = listContainer.querySelectorAll('li');

    document.querySelectorAll('.drag-arrow').forEach(arrow => arrow.remove());

    listItems.forEach(li => {
        const liIndex = parseInt(li.getAttribute('data-index'));

        if (draggedIndex < targetIndex) {
        if (liIndex > draggedIndex && liIndex <= targetIndex) {
            const arrow = document.createElement('span');
            arrow.className = 'drag-arrow';
            arrow.textContent = '↑';
            li.appendChild(arrow);
        }
        } else {
        if (liIndex >= targetIndex && liIndex < draggedIndex) {
            const arrow = document.createElement('span');
            arrow.className = 'drag-arrow';
            arrow.textContent = '↓';
            li.appendChild(arrow);
        }
        }
    });
}



function handleDrop(e) {
    e.preventDefault();
    
    const arrow = e.currentTarget.querySelector('.drag-arrow');
    if (arrow) {
        arrow.remove();
    }
    
    const targetIndex = parseInt(e.currentTarget.getAttribute('data-index'));
    
    if (draggedIndex !== targetIndex && draggedIndex !== -1) {
        const draggedTask = tasks[draggedIndex];
        tasks.splice(draggedIndex, 1);
        
        const newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
        tasks.splice(newIndex, 0, draggedTask);
        
        saveData();
        renderTasks();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    const dragArrows = document.querySelectorAll('.drag-arrow');
    for(let i = 0; i < dragArrows.length; i++) {
        dragArrows[i].remove();
    }
    draggedIndex = -1;
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

let isEditing = false;

function editTask(index, li) {
    isEditing = true;  
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

    let wasCancelled = false; 

    input.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
        wasCancelled = true;   
        isEditing = false;  
        renderTasks();
        } else if (e.key === "Enter") {
        e.stopPropagation();  
        saveEdit();
        }
    });

    input.addEventListener("blur", function() {
        saveEdit();
    });

    function saveEdit() {
        if (wasCancelled) return; 
        let edit = input.value.trim();
        isEditing = false;
        if (edit === "") {
        tasks.splice(index, 1);  
        } else {
        tasks[index].text = edit;
        }
        saveData();
        renderTasks();
    }
}



let focusedIndex = -1;

document.addEventListener("keydown", function(e){
    const listItems = listContainer.querySelectorAll("li");
    if(isEditing) return;

    switch(e.key){
        case "ArrowDown":
            if(listItems.length === 0) return;
            e.preventDefault();
            if(e.shiftKey && focusedIndex >= 0) {
                const currentIndex = parseInt(listItems[focusedIndex].getAttribute("data-index"));
                    if(currentIndex < tasks.length - 1) {
                        [tasks[currentIndex], tasks[currentIndex + 1]] = [tasks[currentIndex + 1], tasks[currentIndex]];
                        saveData();
                        renderTasks();
                        
                        setTimeout(() => {
                            const newItems = listContainer.querySelectorAll("li");
                            focusedIndex = Math.min(focusedIndex + 1, newItems.length - 1);
                            newItems[focusedIndex].focus();
                        }, 0);
                    }
                } else {
                    focusedIndex = (focusedIndex + 1) % listItems.length;
                    listItems[focusedIndex].focus();
                }
            break;

        case "ArrowUp":
            if(listItems.length === 0) return;
            e.preventDefault();
        if(e.shiftKey && focusedIndex >= 0) {

            const currentIndex = parseInt(listItems[focusedIndex].getAttribute("data-index"));
                if(currentIndex > 0) {
                    [tasks[currentIndex], tasks[currentIndex - 1]] = [tasks[currentIndex - 1], tasks[currentIndex]];
                    saveData();
                    renderTasks();
                    
                    setTimeout(() => {
                        const newItems = listContainer.querySelectorAll("li");
                        focusedIndex = Math.max(focusedIndex - 1, 0);
                        newItems[focusedIndex].focus();
                    }, 0);
                }
            } else {
                focusedIndex = (focusedIndex - 1 + listItems.length) % listItems.length;
                listItems[focusedIndex].focus();
            }       
         break;

        case " ": 
            if(document.activeElement.tagName === "INPUT") break;
            if(listItems.length === 0) return;
            e.preventDefault();
            if (focusedIndex >= 0) {
                const index = listItems[focusedIndex].getAttribute("data-index");
                tasks[index].completed = !tasks[index].completed;
                saveData();
                renderTasks();
                setTimeout(() => {
                    const newItems = listContainer.querySelectorAll("li");
                    if (newItems[focusedIndex]) newItems[focusedIndex].focus();
                }, 0);
            }
            break;

        case "n":
        case "N":
            focusedIndex = -1;
            if (document.activeElement.tagName === "INPUT") break;
            e.preventDefault();
            inputBox.focus();
            break;
        
        case "c":
        case "C":
            if(e.shiftKey  && document.activeElement.tagName != "INPUT"){
                e.preventDefault();
                tasks = tasks.filter(task => !task.completed);
                saveData();
                renderTasks();
            }
            break;
        
        case "Backspace":
        case "Delete":
            if(listItems.length === 0) return;
            if(document.activeElement.tagName === "INPUT") break;
            e.preventDefault();
            if (focusedIndex >= 0) {
                const index = listItems[focusedIndex].getAttribute("data-index");
                tasks.splice(index, 1);
                saveData();
                renderTasks();
                const newItems = listContainer.querySelectorAll("li");
                if (newItems.length > 0) {
                    focusedIndex = Math.min(focusedIndex, newItems.length - 1);
                    newItems[focusedIndex].focus();
                } else {
                    focusedIndex = -1;
                    inputBox.focus();
                }
            }
            break;

        case "Enter":
            if (document.activeElement === inputBox) break;
            if(listItems.length === 0) return;
            e.preventDefault();
            if (document.activeElement.tagName === "INPUT") break;
            if (focusedIndex >= 0) {
                const index = listItems[focusedIndex].getAttribute("data-index");
                editTask(index, listItems[focusedIndex]);
            }
            break;
    }
});

listContainer.addEventListener("focus", function(e){
    if(e.target.tagName === "LI"){
        const listItems = listContainer.querySelectorAll("li");
        focusedIndex = Array.from(listItems).indexOf(e.target);
    }
}, true);

const modal = document.getElementById("shortcut-modal");
const btn = document.getElementById("help-button");
const span = document.querySelector(".close-modal");

btn.onclick = function() {
  modal.style.display = "block";
};

span.onclick = function() {
  modal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
