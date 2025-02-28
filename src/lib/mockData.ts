import { writable } from 'svelte/store';

export const users = writable([
    { id: 1, firstname: 'Elias', lastname: 'Vance', email: 'admin@gmail.com', password: '123', role: 'Admin', profilePic: '', office: 'Admin Office', birthday: '1999-02-28', address: 'Cebu City', number: '100'},
    { id: 2, firstname: 'Clara', lastname: 'Sterling', email: 'manager@gmail.com', password: '123', role: 'Manager', profilePic: '', office: 'IT Department', birthday: '1999-02-28', address: 'Cebu City', number: '101' },
    { id: 3, firstname: 'Julian', lastname: 'Hayes', email: 'manager2@gmail.com', password: '123', role: 'Manager', profilePic: '', office: 'HR Department', birthday: '1999-02-28', address: 'Cebu City', number: '102' },
    { id: 4, firstname: 'Olivia', lastname: 'Monroe', email: 'employee@gmail.com', password: '123', role: 'Employee', profilePic: '', office: 'Finance', birthday: '1999-02-28', address: 'Cebu City', number: '103' },
    { id: 5, firstname: 'Samuel', lastname: 'Rivers', email: 'employee2@gmail.com', password: '123', role: 'Employee', profilePic: '', office: 'Marketing', birthday: '1999-02-28', address: 'Cebu City', number: '104' },
]);

export const tasks = writable([
    { id: 1, title: 'Write Report', description: 'The quick brown fox jumps over the lazy dog', startDate: '2025-02-18', endDate: '2025-02-23', status: 'To Do', assignedTo: 4, createdBy: 2, office: 'IT Department' },
    { id: 2, title: 'Prepare Presentation', description: 'The quick brown fox jumps over the lazy dog', startDate: '2025-02-20', endDate: '2025-03-08', status: 'Ongoing', assignedTo: 5, createdBy: 3, office: 'HR Department' },
    { id: 3, title: 'Branch Task', description: 'The quick brown fox jumps over the lazy dog', startDate: '2025-02-20', endDate: '2025-03-19', status: 'Completed', assignedTo: 4, createdBy: 2, office: 'IT Department' },
    // { id: 1, title: 'Write Report', status: 'To Do', assignedTo: 3, createdBy: 3, office: 'Headquarters' },
    // { id: 2, title: 'Review Code', status: 'Ongoing', assignedTo: 2, createdBy: 2, office: 'Headquarters' },
    // { id: 3, title: 'Prepare Presentation', status: 'Completed', assignedTo: 3, createdBy: 2, office: 'Headquarters' },
    // { id: 4, title: 'Branch Task', status: 'To Do', assignedTo: 4, createdBy: 4, office: 'Branch A'},
]);

export const offices = writable(['IT Department', 'HR Department', 'Finance', 'Marketing', 'Admin Office']);
export const roles = writable(['Admin', 'Manager', 'Employee']);

// export const currentUser = writable(null);
export const currentUser = writable({
    id: 3,
    firstname: 'John',
    lastname: 'Doe',
    email: 'employee@gmail.com',
    password:  '123',
    role: 'Employee',
    office: 'Headquarters',
    number: '',
    address: '',
    birthday: '',
    profilePic: '',

});

//Logout Functionality
export const isLoggedIn = writable(false); // Start logged in for testing

export function logoutUser() {
    isLoggedIn.set(false);
    currentUser.set({
        id: 0,
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        role: '',
        office: '',
        birthday: '',
        address: '',
        number: '',
        profilePic: '',
    });
}

