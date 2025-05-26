import { json } from "@sveltejs/kit";

export async function fetchActivities(userId: number, role: string) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/activities?userId=${userId}&role=${role}`);
        if(!res.ok){
            throw new Error('Failed to fetch activities');
        }
        
        const activities = await res.json();
        
        return activities.filter((activity: {date : string}) => {
            const activityDate = new Date(activity.date);
            return activityDate >= threeDaysAgo;
        })

    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}