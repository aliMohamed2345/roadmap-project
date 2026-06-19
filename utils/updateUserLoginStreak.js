
//check if two dates are on the same day
const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

//check if the user has logged in yesterday
const isYesterday = (lastDate, today) => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(lastDate, yesterday);
};


const updateLoginStreak = (user) => {
    const today = new Date();
    const lastLogin = user.streakData?.lastLoginDate;

    //if the user login for the first time 
    if (!lastLogin) {
        user.streakData.currentStreak = 1;
        user.streakData.longestStreak = Math.max(1, user.streakData?.longestStreak || 0);
        user.streakData.lastLoginDate = today;
        return true
    }

    // if user already logged in today  - don't update the login streak
    if (isSameDay(lastLogin, today)) {
        return false
    }

    //Logged in yesterday - streak continues 
    if (isYesterday(lastLogin, today)) {
        user.streakData.currentStreak += 1;
        user.streakData.longestStreak = Math.max(user.streakData.currentStreak, user.longestStreak || 0);
        user.streakData.lastLoginDate = today;
        return true
    }
    //Missed one or more days  

    user.streakData.currentStreak = 1;
    user.streakData.lastLoginDate = today;
    return true

}
export default updateLoginStreak; 