const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const categoryList = document.getElementById("category-list");
const newCategoryInput = document.getElementById("new-category-input");

let tasks = [];
let categories = [];
let activeCategory = "All";

function loadCategories(){
    const storedCategories = localStorage.getItem("categories");
    if(storedCategories){
        categories = JSON.parse(storedCategories);
    } else{
        categories = [{name: "All", immutable: true}];
    }

    if(categories.length > 0){
        activeCategory = categories[0].name;
    }
}

function saveCategories() {
    localStorage.setItem("categories", JSON.stringify(categories));
}

function renderCategories() {
    categoryList.innerHTML = "";

    categories.forEach(category => {
        const li = document.createElement("li");
        li.setAttribute("data-category", category.name);
        li.classList.add("category-item");

        if (category.name === activeCategory) {
            li.classList.add("active");
        }
        if (category.immutable) {
            li.classList.add("all-category");
        }

        const categoryNameSpan = document.createElement("span");
        categoryNameSpan.classList.add("category-name");
        categoryNameSpan.textContent = category.name;
        li.appendChild(categoryNameSpan);

        if (!category.immutable) {
            const deleteSpan = document.createElement("span");
            deleteSpan.className = "delete-category";
            deleteSpan.innerHTML = "\u00d7";
            deleteSpan.title = `Delete "${category.name}" category`;
            li.appendChild(deleteSpan);

            deleteSpan.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteCategory(category.name);
            });
        }

        li.addEventListener("click", () => selectCategory(category.name));
        categoryList.appendChild(li);
    });
}

function addCategory() {
    const newCategoryName = newCategoryInput.value.trim();
    if (newCategoryName === "") {
        alert("Category name cannot be empty!");
        return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
        alert("Category already exists!");
        return;
    }

    categories.push({ name: newCategoryName, immutable: false });
    newCategoryInput.value = "";
    saveCategories();
    renderCategories();
}

newCategoryInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
        addCategory();
    }
});

function selectCategory(categoryName) {
    activeCategory = categoryName;
    renderCategories();
    renderTasks();
}

function deleteCategory(categoryName) {
    if (categoryName === "All") {
        alert("The 'All' category cannot be deleted.");
        return;
    }

    if (confirm(`Are you sure you want to delete the category "${categoryName}"? All tasks within this category will be moved to "All".`)) {
        tasks.forEach(task => {
            if (task.category === categoryName) {
                task.category = "All";
            }
        });

        categories = categories.filter(cat => cat.name !== categoryName);
        saveCategories();
        saveData();

        if (activeCategory === categoryName) {
            activeCategory = "All";
        }
        renderCategories();
        renderTasks();
    }
}

function reorderCategory(direction) {
    const currentIndex = categories.findIndex(cat => cat.name === activeCategory);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === "up") {
        targetIndex = currentIndex - 1;
    } else {
        targetIndex = currentIndex + 1;
    }

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    [categories[currentIndex], categories[targetIndex]] = [categories[targetIndex], categories[currentIndex]];
    
    saveCategories();
    renderCategories();
}

function addTask() {
    if (inputBox.value.trim() === "") {
        alert("You have to write something first!");
    } else {
        tasks.push({
            text: inputBox.value.trim(),
            completed: false,
            category: activeCategory
        });
        inputBox.value = "";
        saveData();
        renderTasks();
    }
}

inputBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addTask();
    }
});

function loadTasks() {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    } else {
        tasks = [];
    }
    tasks.forEach(task => {
        if (!task.hasOwnProperty('category')) {
            task.category = "All";
        }
    });
}

let draggedIndex = -1;

function renderTasks() {
    listContainer.innerHTML = "";
    const filteredTasks = tasks.filter(task =>
        activeCategory === "All" || task.category === activeCategory
    );

    if (filteredTasks.length === 0 && activeCategory !== "All") {
        const noTasksMessage = document.createElement("li");
        noTasksMessage.textContent = `No tasks in "${activeCategory}" category.`;
        noTasksMessage.style.cursor = "default";
        noTasksMessage.style.backgroundColor = "transparent";
        noTasksMessage.style.boxShadow = "none";
        listContainer.appendChild(noTasksMessage);
        return;
    } else if (filteredTasks.length === 0 && activeCategory === "All") {
        const noTasksMessage = document.createElement("li");
        noTasksMessage.textContent = "No tasks yet! Add one above.";
        noTasksMessage.style.cursor = "default";
        noTasksMessage.style.backgroundColor = "transparent";
        noTasksMessage.style.boxShadow = "none";
        listContainer.appendChild(noTasksMessage);
        return;
    }

    filteredTasks.forEach((task, i) => {
        const li = document.createElement("li");
        li.draggable = true;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        const checkSpan = document.createElement("span");
        checkSpan.className = "check-circle";
        li.appendChild(checkSpan);

        const textNode = document.createTextNode(task.text);
        li.appendChild(textNode);

        const delSpan = document.createElement("span");
        delSpan.className = "close";
        delSpan.innerHTML = "\u00d7";
        li.appendChild(delSpan);

        if (task.completed) {
            li.classList.add("checked");
        }

        li.setAttribute("data-original-index", tasks.indexOf(task));
        li.setAttribute("tabindex", 0);

        listContainer.appendChild(li);
    });
}

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.getAttribute('data-original-index'));
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetLi = e.currentTarget;
    const targetOriginalIndex = parseInt(targetLi.getAttribute('data-original-index'));

    if (targetOriginalIndex === draggedIndex) return;

    document.querySelectorAll('.drag-arrow').forEach(arrow => arrow.remove());

    const draggedCategory = tasks[draggedIndex].category;
    const targetCategory = tasks[targetOriginalIndex].category;

    if (draggedCategory !== activeCategory || targetCategory !== activeCategory) {
        return;
    }

    const listItems = Array.from(listContainer.querySelectorAll('li'));
    const draggedElement = listItems.find(item => parseInt(item.getAttribute('data-original-index')) === draggedIndex);

    listItems.forEach(li => {
        if (li === draggedElement) return;

        const liOriginalIndex = parseInt(li.getAttribute('data-original-index'));
        const liCategory = tasks[liOriginalIndex].category;

        if (liCategory === activeCategory || activeCategory === "All") {
            const arrow = document.createElement('span');
            arrow.className = 'drag-arrow';

            if (draggedIndex < liOriginalIndex && liOriginalIndex <= targetOriginalIndex) {
                arrow.textContent = '↑';
                li.appendChild(arrow);
            } else if (draggedIndex > liOriginalIndex && liOriginalIndex >= targetOriginalIndex) {
                arrow.textContent = '↓';
                li.appendChild(arrow);
            }
        }
    });
}

function handleDrop(e) {
    e.preventDefault();

    document.querySelectorAll('.drag-arrow').forEach(arrow => arrow.remove());

    const targetOriginalIndex = parseInt(e.currentTarget.getAttribute('data-original-index'));

    if (draggedIndex === -1 || draggedIndex === targetOriginalIndex) {
        return;
    }

    const draggedTask = tasks[draggedIndex];
    const targetTask = tasks[targetOriginalIndex];

    if (draggedTask.category !== activeCategory && activeCategory !== "All") {
        return;
    }
    if (targetTask.category !== activeCategory && activeCategory !== "All") {
        return;
    }

    const originalTaskIndex = tasks.indexOf(draggedTask);
    const targetTaskIndex = tasks.indexOf(targetTask);

    if (originalTaskIndex === -1 || targetTaskIndex === -1) return;

    tasks.splice(originalTaskIndex, 1);
    tasks.splice(targetTaskIndex, 0, draggedTask);

    saveData();
    renderTasks();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    const dragArrows = document.querySelectorAll('.drag-arrow');
    for (let i = 0; i < dragArrows.length; i++) {
        dragArrows[i].remove();
    }
    draggedIndex = -1;
}

function saveData() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

loadCategories();
loadTasks();
renderCategories();
renderTasks();

listContainer.addEventListener("click", function (e) {
    const li = e.target.closest("li[data-original-index]");
    if (!li) return;

    const originalIndex = parseInt(li.getAttribute("data-original-index"));
    const task = tasks[originalIndex];

    if (e.target.classList.contains("check-circle")) {
        task.completed = !task.completed;
    } else if (e.target.classList.contains("close")) {
        tasks.splice(originalIndex, 1);
    } else {
        if (li.style.cursor === "default") return;
        editTask(originalIndex, li);
        return;
    }

    saveData();
    renderTasks();
});

let isEditing = false;

function editTask(originalIndex, li) {
    isEditing = true;
    let input = document.createElement("input");
    input.type = "text";
    input.value = tasks[originalIndex].text;
    input.className = "edit-input";

    li.textContent = "";
    li.appendChild(input);
    input.focus();

    const closeSpan = document.createElement("span");
    closeSpan.className = "close";
    closeSpan.innerHTML = "\u00d7";
    li.appendChild(closeSpan);

    let wasCancelled = false;

    input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            wasCancelled = true;
            isEditing = false;
            renderTasks();
        } else if (e.key === "Enter") {
            e.stopPropagation();
            saveEdit();
        }
    });

    input.addEventListener("blur", function () {
        saveEdit();
    });

    function saveEdit() {
        if (wasCancelled) return;
        let edit = input.value.trim();
        isEditing = false;
        if (edit === "") {
            tasks.splice(originalIndex, 1);
        } else {
            tasks[originalIndex].text = edit;
        }
        saveData();
        renderTasks();
    }
}

let focusedIndex = -1;

document.addEventListener("keydown", function (e) {
    const listItems = Array.from(listContainer.querySelectorAll("li"));

    if (e.key === "Escape") {
        if (modal.style.display === "block") {
            modal.style.display = "none";
            return;
        }

        if(document.activeElement){
            document.activeElement.blur();
        }
        focusedIndex = -1;
        return;
    }

    if (e.key === "n" || e.key === "N") {
        if (document.activeElement.tagName === "INPUT") return;
        e.preventDefault();
        focusedIndex = -1; 

        if (e.shiftKey) {
            newCategoryInput.focus(); 
        } else {
            inputBox.focus(); 
        }
        return; 
    }

    if (e.key === "i" || e.key === "I") {
        if (document.activeElement.tagName === "INPUT") return;
        e.preventDefault();
        modal.style.display = "block";
        return;
    }

    if (isEditing || listItems.length === 0 || listItems[0].style.cursor === "default") {
        if (e.ctrlKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            
            if (e.shiftKey) {
                if (e.key === "ArrowUp") {
                    reorderCategory("up");
                } else if (e.key === "ArrowDown") {
                    reorderCategory("down");
                }
                return;
            }
            
            const categoryItems = Array.from(categoryList.querySelectorAll("li.category-item"));
            if (categoryItems.length === 0) return;

            const currentActiveIndex = categories.findIndex(cat => cat.name === activeCategory);
            let nextIndex = currentActiveIndex;

            if (e.key === "ArrowDown") {
                nextIndex = (currentActiveIndex + 1) % categories.length;
            } else if (e.key === "ArrowUp") {
                nextIndex = (currentActiveIndex - 1 + categories.length) % categories.length;
            }

            if (nextIndex !== currentActiveIndex) {
                selectCategory(categories[nextIndex].name);
            }
            return; 
        }
        return; 
    }

    const filteredTasks = tasks.filter(task =>
        activeCategory === "All" || task.category === activeCategory
    );

    let currentOriginalIndex = -1;
    if (focusedIndex >= 0 && focusedIndex < listItems.length) {
        currentOriginalIndex = parseInt(listItems[focusedIndex].getAttribute("data-original-index"));
    }

    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            if (e.ctrlKey) {
                if (e.shiftKey) {
                    reorderCategory("down");
                    return;
                }
                
                const categoryItems = Array.from(categoryList.querySelectorAll("li.category-item"));
                if (categoryItems.length === 0) return;

                const currentActiveIndex = categories.findIndex(cat => cat.name === activeCategory);
                const nextIndex = (currentActiveIndex + 1) % categories.length;

                if (nextIndex !== currentActiveIndex) {
                    selectCategory(categories[nextIndex].name);
                }
            } else if (e.shiftKey && focusedIndex >= 0) {
                const currentFilteredIndex = filteredTasks.findIndex(task => tasks.indexOf(task) === currentOriginalIndex);
                if (currentFilteredIndex < filteredTasks.length - 1) {
                    const nextFilteredTaskOriginalIndex = tasks.indexOf(filteredTasks[currentFilteredIndex + 1]);

                    const taskToMove = tasks[currentOriginalIndex];
                    const targetTask = tasks[nextFilteredTaskOriginalIndex];

                    const tempTasks = [...tasks];
                    const taskToMoveActualIndex = tempTasks.indexOf(taskToMove);
                    const targetTaskActualIndex = tempTasks.indexOf(targetTask);

                    if (taskToMoveActualIndex > -1 && targetTaskActualIndex > -1) {
                        [tempTasks[taskToMoveActualIndex], tempTasks[targetTaskActualIndex]] = [tempTasks[targetTaskActualIndex], tempTasks[taskToMoveActualIndex]];
                        tasks = tempTasks;
                        saveData();
                        renderTasks();

                        setTimeout(() => {
                            const newItems = listContainer.querySelectorAll("li");
                            focusedIndex = Math.min(focusedIndex + 1, newItems.length - 1);
                            if (newItems[focusedIndex]) newItems[focusedIndex].focus();
                        }, 0);
                    }
                }
            } else { 
                focusedIndex = (focusedIndex + 1) % listItems.length;
                listItems[focusedIndex].focus();
            }
            break;

        case "ArrowUp":
            e.preventDefault();
            if (e.ctrlKey) {
                if (e.shiftKey) {
                    reorderCategory("up");
                    return;
                }
                
                const categoryItems = Array.from(categoryList.querySelectorAll("li.category-item"));
                if (categoryItems.length === 0) return;

                const currentActiveIndex = categories.findIndex(cat => cat.name === activeCategory);
                const nextIndex = (currentActiveIndex - 1 + categories.length) % categories.length;

                if (nextIndex !== currentActiveIndex) {
                    selectCategory(categories[nextIndex].name);
                }
            } else if (e.shiftKey && focusedIndex >= 0) { 
                const currentFilteredIndex = filteredTasks.findIndex(task => tasks.indexOf(task) === currentOriginalIndex);
                if (currentFilteredIndex > 0) {
                    const prevFilteredTaskOriginalIndex = tasks.indexOf(filteredTasks[currentFilteredIndex - 1]);

                    const taskToMove = tasks[currentOriginalIndex];
                    const targetTask = tasks[prevFilteredTaskOriginalIndex];

                    const tempTasks = [...tasks];
                    const taskToMoveActualIndex = tempTasks.indexOf(taskToMove);
                    const targetTaskActualIndex = tempTasks.indexOf(targetTask);

                    if (taskToMoveActualIndex > -1 && targetTaskActualIndex > -1) {
                        [tempTasks[taskToMoveActualIndex], tempTasks[targetTaskActualIndex]] = [tempTasks[targetTaskActualIndex], tempTasks[taskToMoveActualIndex]];
                        tasks = tempTasks;
                        saveData();
                        renderTasks();

                        setTimeout(() => {
                            const newItems = listContainer.querySelectorAll("li");
                            focusedIndex = Math.max(focusedIndex - 1, 0);
                            if (newItems[focusedIndex]) newItems[focusedIndex].focus();
                        }, 0);
                    }
                }
            } else { 
                focusedIndex = (focusedIndex - 1 + listItems.length) % listItems.length;
                listItems[focusedIndex].focus();
            }
            break;

        case " ":
            if (document.activeElement.tagName === "INPUT") break;
            e.preventDefault();
            if (focusedIndex >= 0) {
                const originalIdx = parseInt(listItems[focusedIndex].getAttribute("data-original-index"));
                tasks[originalIdx].completed = !tasks[originalIdx].completed;
                saveData();
                renderTasks();
                setTimeout(() => {
                    const newItems = listContainer.querySelectorAll("li");
                    if (newItems[focusedIndex]) newItems[focusedIndex].focus();
                }, 0);
            }
            break;

        case "c":
        case "C":
            if (e.shiftKey && document.activeElement.tagName != "INPUT") {
                e.preventDefault();
                if (activeCategory === "All") {
                    tasks = tasks.filter(task => !task.completed);
                } else {
                    tasks = tasks.filter(task => !(task.completed && task.category === activeCategory));
                }
                saveData();
                renderTasks();
            }
            break;

        case "Backspace":
        case "Delete":
            if (document.activeElement.tagName === "INPUT") break;
            e.preventDefault();
            if (focusedIndex >= 0) {
                const originalIdx = parseInt(listItems[focusedIndex].getAttribute("data-original-index"));
                tasks.splice(originalIdx, 1);
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
            e.preventDefault();
            if (document.activeElement.tagName === "INPUT") break;
            if (focusedIndex >= 0) {
                const originalIdx = parseInt(listItems[focusedIndex].getAttribute("data-original-index"));
                editTask(originalIdx, listItems[focusedIndex]);
            }
            break;
    }
});

listContainer.addEventListener("focus", function (e) {
    if (e.target.tagName === "LI") {
        const listItems = Array.from(listContainer.querySelectorAll("li"));
        focusedIndex = listItems.indexOf(e.target);
    }
}, true);

const modal = document.getElementById("shortcut-modal");
const btn = document.getElementById("help-button");
const span = document.querySelector(".close-modal");

btn.onclick = function () {
    modal.style.display = "block";
};

span.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};