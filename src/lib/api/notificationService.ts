const API_URL = `${import.meta.env.VITE_BASE_URL}`;
let errorMessage = "";

export async function removeNotification(notificationId: number | null) {
    if(!notificationId) {
        console.error("Cannot delete Notification id: ID is undefined");
        return;
    } else if(!confirm("Are you sure you want to delete this Notification?")) {
        return;
    } 
        try {
            await deleteNotification(notificationId);
            alert("Notification Deleted Successfully");
        } catch (error) {
            console.error("Error deleting notification :", error);
            errorMessage = "Failed to delete notification. Please try again later!";
        }
}

//Delete Task
export async function deleteNotification(id: number) {
    const res = await fetch(`${API_URL}/notification/${id}`, { 
        method: "DELETE",
    });

    if(!res.ok){
        throw new Error("Failed to Delete Task!")
    }
    return res.json();
}