// this file takes the watch history with details (this comes from the youtube api from part 1)
// and computes some stats about it

function getAllStats() {
    const file = document.getElementById("file_input").files[0];
    if (!file) {
        console.log("no file detected");
        return;
    }
    readJsonFileToJsObject(file, (watchHistoryWithDetails) => {
        if (!watchHistoryWithDetails) {
            console.log("there was a problem reading the file. sad.");
            return;
        }
        if (!watchHistoryWithDetails.length) {
            console.log("the uploaded file was empty or an invalid JSON array. sad.");
            return;
        }
        // console.log("here is the object you just uploaded:");
        // console.log(watchHistoryWithDetails);

        // showVideoStructure(watchHistoryWithDetails);

        console.log("Number of videos:", watchHistoryWithDetails.length);

        console.log('-----')

        const watchTime = computeTotalWatchTime(watchHistoryWithDetails);
        console.log("Watch time:", watchTime);
        
        console.log('-----')

        const mostPopularVideo = getMostPopularVideo(watchHistoryWithDetails);
        console.log("Most popular video:", mostPopularVideo);
        console.log("Most popular video has this viewcount:", mostPopularVideo.statistics.viewCount);
        const linkToMostPopularVideo = getYoutubeLinkFromId(mostPopularVideo.id);
        console.log(linkToMostPopularVideo)

        // Add more stats here
    });
}

// just print an example video for debugging purposes
function showVideoStructure(history) {
    console.log(history[0]);
}

function computeTotalWatchTime(history) {
    let totalSeconds = 0;
    for (const video of history) {
        const duration = video.contentDetails.duration;
        const seconds = formatVideoDuration(duration);
        if (isNaN(seconds)) {
            console.log("error parsing duration:", duration);
            continue;
        }
        totalSeconds += seconds;
    }

    // console.log(totalSeconds)
    let minutes = Math.floor(totalSeconds / 60);
    totalSeconds = totalSeconds % 60;
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    let days = Math.floor(hours / 24);
    hours = hours % 24;

    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: totalSeconds,
    };
}

function getMostPopularVideo(history) {
    let maxViewCount = -1;
    let mostPopularVideo;
    for (const video of history) {
        const viewCount = parseInt(video.statistics.viewCount);
        if (viewCount > maxViewCount) {
            maxViewCount = viewCount;
            mostPopularVideo = video;
        }
    }
    return mostPopularVideo;
}
