/**
 * Sample JavaScript code for youtube.videos.list
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/code-samples#javascript
 */

let allEm = null;

function authenticate() {
    return gapi.auth2
        .getAuthInstance()
        .signIn({ scope: "https://www.googleapis.com/auth/youtube.readonly" })
        .then(
            function () {
                console.log("Sign-in successful");
            },
            function (err) {
                console.error("Error signing in", err);
            }
        );
}
function loadClient() {
    const KEY = document.getElementById("api_key_input").value;
    gapi.client.setApiKey(KEY);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest").then(
        function () {
            console.log("GAPI client loaded for API");
            document.getElementById("confirmation").innerHTML =
                "confirmation message! ready to click 'execute' now!";
        },
        function (err) {
            console.error("Error loading GAPI client for API", err);
        }
    );
}

// returns a list of all the video ids in the user's watch history file
function parseWatchHistory() {
    const file = document.getElementById("file_input").files[0];
    const allDaIds = [];
    if (file) {
        const reader = new FileReader(file);
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                // console.log("DEBUG:::::::", jsonData[1694]);

                for (let i = 0; i < jsonData.length; i++) {
                    // for (let i = 50; i < 75; i++) {
                    const titleUrl = jsonData[i].titleUrl;
                    if (titleUrl === undefined) {
                        // The titleUrl is undefined for deleted videos.
                        // I have no way of seeing the length of a deleted video, so just move on.
                        continue;
                    }
                    if (jsonData[i].time.slice(0, 4) !== "2023") {
                        // Not from this year. Don't care.
                        continue;
                    }
                    const startOfId = titleUrl.indexOf("?v=") + "?v=".length;
                    const videoId = titleUrl.slice(startOfId);
                    // console.log(videoId);
                    allDaIds.push(videoId);
                }
                return allDaIds;
            } catch (error) {
                console.error("Error parsing JSON file:", error);
            }
        };
        reader.readAsText(file);
    }
    // return allDaIds;
    allEm = allDaIds;
}

function testFormatting() {
    console.log("testing...");
    console.log(formatVideoDuration("PT2M10S"));
    console.log(formatVideoDuration("PT17S"));
    console.log(formatVideoDuration("PT3M"));
    console.log(formatVideoDuration("PT60M"));
    console.log("testing done.");
}

/**
 * @param {string} noPrefix formatted like "PT___M___S" where exclusively one blank is optional
 * @return {number} video duration in seconds
 */
function formatVideoDuration(duration) {
    // Here are some tips for reading the duration string's format:
    // Many videos have both seconds and minutes -> "PT3M10S"
    // Some videos are shorter than a minute -> "PT17S"
    // Some videos are an integer number of minutes long -> "PT26M"
    // Also, preceding 0s are never used -> "PT5S" or "PT25S" but never "PT05S"
    // hours: "P1DT1H51M23S"
    // TODO HANDLE HOURS

    // If video has minutes -> get minutes
    // If video has seconds -> get seconds
    // dont forget to to parseInt()

    const noPrefix = duration.substring(2);

    const indexOfM = noPrefix.indexOf("M");
    const indexOfS = noPrefix.indexOf("S");

    if (indexOfM === -1 && indexOfS === -1) {
        // What.
        console.log("yeahhhh... uhhhhh. a video duration had no seconds and no minutes 🤷");
    } else if (indexOfM === -1) {
        // This video's short.
        const seconds = noPrefix.slice(0, indexOfS);
        return parseInt(seconds);
    } else if (indexOfS === -1) {
        // This video is an integer number of minutes long.
        const minutes = noPrefix.slice(0, indexOfM);
        return 60 * parseInt(minutes);
    } else {
        const minutes = noPrefix.slice(0, indexOfM);
        const seconds = noPrefix.slice(indexOfM + 1, indexOfS);
        return parseInt(seconds) + 60 * parseInt(minutes);
    }
}

// Make sure the client is loaded and sign-in is complete before calling this method.
// It seems that google applies a limit of 50 videos per request. You'll need to call this multiple times.
function fetchARoundOfVideos(lower, upper) {
    if (upper - lower > 50) {
        console.log(
            "whoa nelly! you're making too large a request! try splitting 'er up next time."
        );
        return;
    }
    const allDaIds = allEm.slice(lower, upper);
    return gapi.client.youtube.videos
        .list({
            part: ["snippet,contentDetails,statistics"],
            id: allDaIds,
        })
        .then(
            function (response) {
                console.log("RESULTY FUN TIME");
                console.log(response.result);
                console.log("RESULTY FUN TIME");
                // Handle the results here (response.result has the parsed body).
                let totalSeconds = 0;
                let i = 0;
                console.log("Total number of videos from api: " + response.result.items.length);
                for (const video of response.result.items) {
                    const seconds = formatVideoDuration(video.contentDetails.duration);
                    if (isNaN(seconds)) {
                        console.log("invalid number:", seconds);
                    } else {
                        totalSeconds += seconds;
                    }
                }
                console.log("Raw total seconds: ", +totalSeconds);

                let totalMinutes = Math.floor(totalSeconds / 60);
                totalSeconds = totalSeconds % 60;
                let totalHours = Math.floor(totalMinutes / 60);
                totalMinutes = totalMinutes % 60;

                document.getElementById("seconds").innerHTML = "Seconds: " + totalSeconds;
                document.getElementById("minutes").innerHTML = "Minutes: " + totalMinutes;
                document.getElementById("hours").innerHTML = "Hours: " + totalHours;
            },
            function (err) {
                console.error("Execute error", err);
            }
        );
}

function makeApiCallButReturnTheObject(lower, upper) {
    if (upper - lower > 50) {
        console.log(
            "whoa nelly! you're making too large a request! try splitting 'er up next time."
        );
        return;
    }
    const allDaIds = allEm.slice(lower, upper);
    return gapi.client.youtube.videos
        .list({
            part: ["snippet,contentDetails,statistics"],
            id: allDaIds,
        })
        .then(
            (response) => {
                // Handle the results here (response.result has the parsed body).
                return response.result;
            },
            (err) => {
                console.error("Execute error", err);
            }
        );
}

async function execute() {
    // this is such a hack.
    // one thread is writing video IDs into a list.
    // another is reading from that list.
    // these can run at the same time so long as the writing thread stays ahead of the reading one.
    // so, just wait a little bit after spinning up the writing thread.
    // ...right?
    // 50ms seems to work fine almost all of the time. for safety, i'll do at least 10x that.
    // const allDaIds = parseWatchHistory();
    // setTimeout(() => {
    // doApiStuff(allDaIds);
    // fetchVideos()
    // }, 500);

    const MAX_LIST_SIZE = 50;

    // allEm = allEm.slice(0, 2000);

    const allResponses = [];

    let totalSeconds = 0;
    let totalCount = 0;
    for (let i = 0; i < allEm.length; i += MAX_LIST_SIZE) {
        // TODO can i do this in parallel? like, can you make all the calls before beginning to process?
        // maybe i'm already doing that. i'm not sure. copilot really wants to pitch in here.
        const res = await makeApiCallButReturnTheObject(i, i + MAX_LIST_SIZE);
        console.log(res);
        allResponses.push(...res.items);
        totalCount += res.items.length;
        for (const video of res.items) {
            const seconds = formatVideoDuration(video.contentDetails.duration);
            if (isNaN(seconds)) {
                console.log("invalid number:", seconds);
                console.log(video);
            } else {
                totalSeconds += seconds;
            }
        }
    }

    console.log("Total number of videos from api: " + totalCount);
    console.log("Raw total seconds: ", +totalSeconds);

    let totalMinutes = Math.floor(totalSeconds / 60);
    totalSeconds = totalSeconds % 60;
    let totalHours = Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    document.getElementById("seconds").innerHTML = "Seconds: " + totalSeconds;
    document.getElementById("minutes").innerHTML = "Minutes: " + totalMinutes;
    document.getElementById("hours").innerHTML = "Hours: " + totalHours;

    downloadFile(JSON.stringify(allResponses), "mynuts.txt", "text/plain");
}

function computeTotalWatchTimeEntirelyLocally(objToParse) {
    for (let i = 0; i < 10; i++) {
        console.log(objToParse[i]);
    }
}

gapi.load("client:auth2", function () {
    // i have no idea what a client id is nor why it is needed.
    // works just fine without a client id.
    gapi.auth2.init({ client_id: "YOUR_CLIENT_ID" });
});

function downloadFile(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
// download(jsonData, 'json.txt', 'text/plain');

// this function sucks. the FileReader api doesn't use promises, so you'll have to give this
// function a callback.we're going on a trip to callback hell.
function readJsonFileToJsObject(file, callback) {
    if (file) {
        const reader = new FileReader(file);
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                callback(jsonData);
            } catch (error) {
                console.error("Error parsing JSON file:", error);
            }
        };
        reader.readAsText(file);
    }
}

// the backup file is NOT the thing that causes API stuff. we're past that now.
const backupUploadInput = document.getElementById("backup_upload");

const shitMyPants = document.getElementById("shitMyPants");
shitMyPants.addEventListener("click", () => {
    readJsonFileToJsObject(backupUploadInput.files[0], (jsonResult) => {
        // * this section of the code is the bee's knees

        console.log("got new obj!");
        console.log(jsonResult);
        computeTotalWatchTime(jsonResult);
    });
});

/**
 * @param {Object} responseData response from the youtube api
 * @returns nothing. updates the dom directly from here.
 */
function computeTotalWatchTime(responseData) {
    for (let i = 0; i < 10; i++) {
        const rawDuration = responseData[i].contentDetails.duration;
        console.log(rawDuration);
        const formattedDuration = formatVideoDuration(rawDuration);
        console.log(formattedDuration);
    }
}
