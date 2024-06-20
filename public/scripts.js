document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:3000/api/v1/tasks';
    const taskList = document.getElementById('task-list');

    async function fetchTasks() {
        try {
            const response = await fetch(apiUrl);
            const tasks = await response.json();
            console.log('Fetched tasks:', tasks); // Для отладки
            taskList.innerHTML = '';
            tasks.forEach(task => {
                addTaskToDOM(task);
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    function addTaskToDOM(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');
        taskElement.setAttribute('data-task-id', task._id);

        taskElement.innerHTML = `
            <span class="task-title">${task.title}</span>
            <span class="edit-btn">...</span>
            <div class="popup-menu">
                <button class="edit-task">Редактировать</button>
                <button class="delete-task">Удалить</button>
            </div>
        `;

        taskList.appendChild(taskElement);
        setupTaskEventListeners(taskElement);
    }

    function setupTaskEventListeners(taskElement) {
        taskElement.addEventListener('dragstart', handleDragStart, false);
        taskElement.addEventListener('dragenter', handleDragEnter, false);
        taskElement.addEventListener('dragover', handleDragOver, false);
        taskElement.addEventListener('dragleave', handleDragLeave, false);
        taskElement.addEventListener('drop', handleDrop, false);
        taskElement.addEventListener('dragend', handleDragEnd, false);

        taskElement.querySelector('.edit-btn').addEventListener('click', function() {
            const popupMenu = this.nextElementSibling;
            popupMenu.style.display = popupMenu.style.display === 'block' ? 'none' : 'block';
        });

        taskElement.querySelector('.edit-task').addEventListener('click', function() {
            const taskId = taskElement.getAttribute('data-task-id');
            fetch(`${apiUrl}/${taskId}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('edit-task-id').value = data._id;
                    document.getElementById('edit-task-title').value = data.title;
                    document.getElementById('edit-task-value').value = data.value;
                    document.getElementById('edit-task-date').value = new Date(data.expiredDate).toISOString().substr(0, 10);
                    document.getElementById('edit-task-stage').value = data.stage;
                    document.getElementById('edit-task-progress').value = data.completeProgress;

                    showModal('edit-task-modal');
                })
                .catch(error => console.error('Error fetching task:', error));
        });

        taskElement.querySelector('.delete-task').addEventListener('click', function() {
            const taskId = taskElement.getAttribute('data-task-id');
            document.getElementById('confirm-delete-task-btn').onclick = function() {
                deleteTask(taskId);
                closeModal('delete-task-modal');
            };
            showModal('delete-task-modal');
        });
    }

    function handleDragStart(e) {
        this.style.opacity = '0.1';
        this.style.border = '3px dashed #c4cad3';
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('task-hover');
    }

    function handleDragLeave(e) {
        this.classList.remove('task-hover');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (dragSrcEl !== this) {
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
        }
        return false;
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
        this.style.border = '3px dashed transparent';
        items.forEach(function (item) {
            item.classList.remove('task-hover');
        });
    }

    function showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    document.getElementById('add-task-btn').addEventListener('click', () => {
        document.getElementById('edit-task-id').value = '';
        document.getElementById('edit-task-title').value = '';
        document.getElementById('edit-task-value').value = '';
        document.getElementById('edit-task-date').value = '';
        document.getElementById('edit-task-stage').value = 'Ready';
        document.getElementById('edit-task-progress').value = 0;
        showModal('edit-task-modal');
    });

    document.getElementById('save-task-btn').addEventListener('click', async () => {
        const taskId = document.getElementById('edit-task-id').value;
        const taskData = {
            title: document.getElementById('edit-task-title').value,
            value: document.getElementById('edit-task-value').value,
            expiredDate: document.getElementById('edit-task-date').value,
            stage: document.getElementById('edit-task-stage').value,
            completeProgress: document.getElementById('edit-task-progress').value,
        };

        if (taskId) {
            await fetch(`${apiUrl}/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });
        } else {
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });
        }

        closeModal('edit-task-modal');
        fetchTasks();
    });

    async function deleteTask(taskId) {
        await fetch(`${apiUrl}/${taskId}`, {
            method: 'DELETE',
        });
        fetchTasks();
    }

    const closeBtns = document.querySelectorAll('.close');
    closeBtns.forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
        });
    });

    document.getElementById('cancel-task-btn').addEventListener('click', function() {
        closeModal('edit-task-modal');
    });

    document.getElementById('cancel-delete-task-btn').addEventListener('click', function() {
        closeModal('delete-task-modal');
    });

    fetchTasks();
});
