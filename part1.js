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
                "authentication successful! ready to click 'execute' now!";
            document.getElementById("authButton").disabled = true;
            document.getElementById("executeButton").disabled = false;
        },
        function (err) {
            console.error("Error loading GAPI client for API", err);
        }
    );
}
gapi.load("client:auth2", function () {
    // i have no idea what a client id is nor why it is needed.
    // works just fine without a client id.
    gapi.auth2.init({ client_id: "YOUR_CLIENT_ID" });
});

document.getElementById("downloadButton").disabled = true;

// this value is ONLY to be used for downloading the results.
// no messing with my global variables!!! 😠
let results = null;

// Make sure the client is loaded and sign-in is complete before calling this method.
// It seems that google applies a limit of 50 videos per request. You'll need to call this multiple times.
function makeApiCallButReturnTheObject(someIds) {
    // console.log(someIds);
    const MAX_IDS_PER_REQUEST = 50;
    if (someIds.length > MAX_IDS_PER_REQUEST) {
        console.log(
            "whoa nelly! you're making too large a request! try splitting 'er up next time."
        );
        return;
    }
    return gapi.client.youtube.videos
        .list({
            part: ["snippet,contentDetails,statistics"],
            id: someIds,
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

/**
 * @param {function} callback what to do when done
 */
async function parseWatchHistory(callback) {
    const file_input = document.getElementById("file_input").files[0];
    readJsonFileToJsObject(file_input, async (jsonData) => {
        // console.log(jsonData);
        const allIds = [];
        for (let i = 0; i < jsonData.length; i++) {
            const titleUrl = jsonData[i].titleUrl;
            if (titleUrl === undefined) {
                // The titleUrl is undefined for deleted videos.
                // This video was probably unlisted or taken down for some reason.
                // I have no way of seeing the length of a deleted video, so just skip it.
                continue;
            }
            if (jsonData[i].time.slice(0, 4) !== "2023") {
                // Not from this year. Don't care.
                continue;
            }
            const startOfId = titleUrl.indexOf("?v=") + "?v=".length;
            const videoId = titleUrl.slice(startOfId);
            allIds.push(videoId);
        }
        console.log("Number of videos in original watch history file:", allIds.length);
        callback(allIds);
    });
}

async function execute() {
    parseWatchHistory(async (allIds) => {
        allIds = allIds.slice(0, 10);
        const MAX_IDS_PER_REQUEST = 50; // google's limit
        let totalCount = 0;
        const allResponses = [];
        for (let i = 0; i < allIds.length; i += MAX_IDS_PER_REQUEST) {
            console.log("making request for video " + (i + 1) + " of " + allIds.length + "...");
            const someIds = allIds.slice(i, i + MAX_IDS_PER_REQUEST);
            const res = await makeApiCallButReturnTheObject(someIds);
            allResponses.push(...res.items);
            totalCount += res.items.length;
        }
        console.log("Number of videos retrieved from youtube API:", totalCount);
        document.getElementById("downloadButton").disabled = false;
        results = allResponses;
    });
}

function downloadResults() {
    downloadFile(JSON.stringify(results), "YouTube_API_Results.json", "text/plain");
}
