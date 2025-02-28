import { writable, get, derived } from 'svelte/store';
import { users, tasks, currentUser } from './mockData';
import { goto } from '$app/navigation';

// export function logout() {
//     user.set(null); // Clear user session
//     localStorage.removeItem('auth'); // Optional: Clear stored auth data
//     goto('/login'); // Redirect to login
// }

//User Management
export function createUser() {
    users.update(currentUsers => {
        const newId = currentUsers.length + 1;
        const newUser = get(newUserForm);
        return [...currentUsers, { ...newUser, id: newId, profilePic: '' }];
    });
    showUserForm.set(false);
    newUserForm.set({ id: null, 
                      firstname: '', 
                      lastname: '', 
                      email: '', 
                      password: '', 
                      role: 'Employee', 
                      office: '', 
                      birthday: '', 
                      address: '', 
                      number: '' });
}

export function editUser(user: { id: number; email: string; role: string; office: string }) {
    newUserForm.set({ ...user, firstname: '', lastname: '', password: '', birthday: '', address: '', number: '' });
    showUserForm.set(true);
}

export function updateUser() {
    users.update(currentUsers => 
        currentUsers.map(user => {
            const newUser = get(newUserForm);
            return user.id === newUser.id ? { ...newUser, id: user.id, profilePic: user.profilePic } : user;
        })
    );
    showUserForm.set(false);
    newUserForm.set({ id: null, 
                      firstname: '', 
                      lastname: '', 
                      email: '', 
                      password: '', 
                      role: 'Employee', 
                      office: '', 
                      birthday: '', 
                      address: '', 
                      number: '' });
}

export function deleteUser(id: number) {
    users.update(currentUsers => currentUsers.filter(user => user.id !== id));
}

export function assignOffice(userId: number, event: Event) {
    const selectedOffice = (event.target as HTMLSelectElement).value;
    users.update(currentUsers => 
        currentUsers.map(user => (user.id === userId ? { ...user, office: selectedOffice } : user))
    );
}

//Task Management
export function createTask() {
    tasks.update(currentTasks => {
        const newId = currentTasks.length + 1;
        let createdById = 0;
        let office = '';

        currentUser.subscribe(user => {
            createdById = user.id;
            office = user.office;
        });

        const newTask = get(newTaskForm);
        return [...currentTasks, { ...newTask, id: newId, createdBy: createdById, office }];
    });

    showTaskForm.set(false);
    newTaskForm.set({ id: 0, 
                      title: '', 
                      description: '', 
                      startDate: '', 
                      endDate: '', 
                      status: 'To Do', 
                      assignedTo: 0, 
                      createdBy: 0, 
                      office: '' });
}

export function editTask(task: { id: number; 
                                 title: string; 
                                 status: string; 
                                 assignedTo: number; 
                                 createdBy: number; 
                                 office: string }) {
    newTaskForm.set({ ...task, description: '', startDate: '', endDate: '' });
    showTaskForm.set(true);
}

export function updateTask() {
    tasks.update(currentTasks => 
        currentTasks.map(task => {
            const newTask = get(newTaskForm);
            return task.id === newTask.id ? { ...newTask } : task;
        })
    );
    showTaskForm.set(false);
    newTaskForm.set({ id: 0, 
                      title: '', 
                      description: '', 
                      startDate: '', 
                      endDate: '', 
                      status: 'To Do', 
                      assignedTo: 0, 
                      createdBy: 0, 
                      office: '' });
}

export function deleteTask(id: number) {
    tasks.update(currentTasks => currentTasks.filter(task => task.id !== id));
}

export function assignTask(taskId: number, event: Event) {
    const assignedUserId = Number((event.target as HTMLSelectElement).value);
    tasks.update(currentTasks => 
        currentTasks.map(task => (task.id === taskId ? { ...task, assignedTo: assignedUserId } : task))
    );
}

export function changeTaskStatus(taskId: number, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    tasks.update(currentTasks => 
        currentTasks.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
}

//Utility Functions
export function hasRole(role: string) {
    let isAllowed = false;
    currentUser.subscribe(user => {
        isAllowed = user.role === role || user.role === 'Admin';
    });
    return isAllowed;
}

export function isSameOffice(office: string) {
    let sameOffice = false;
    currentUser.subscribe(user => {
        sameOffice = user.office === office || user.role === 'Admin';
    });
    return sameOffice;
}

//Store Mock Up Data for Backend

export const newUserForm = writable<{ id: number | null; 
                                      firstname: string; 
                                      lastname: string; 
                                      email: string; 
                                      password: string; 
                                      role: string; 
                                      office: string; 
                                      birthday: string; 
                                      address: string; 
                                      number: string }>({ id: null, 
                                                          firstname: '', 
                                                          lastname: '', 
                                                          email: '', 
                                                          password: '', 
                                                          role: 'Employee', 
                                                          office: '', 
                                                          birthday: '', 
                                                          address: '', 
                                                          number: '' });

export const newTaskForm = writable({ id: 0, 
                                      title: '', 
                                      description: '', 
                                      startDate: '', 
                                      endDate: '', 
                                      status: 'To Do', 
                                      assignedTo: 0, 
                                      createdBy: 0, 
                                      office: '' });

export const showTaskForm = writable(false);
export const showUserForm = writable(false);

// export const user = writable(null); // Store for authenticated user


    