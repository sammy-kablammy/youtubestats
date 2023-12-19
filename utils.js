/**
 * @param {file} file file to read
 * @param {function} callback what to do when done
 */
async function readJsonFileToJsObject(file, callback) {
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

/**
 * @param {string} noPrefix formatted like "PT___M___S" where exclusively one blank is optional
 * @return {number} video duration in seconds
 */
function formatVideoDuration(duration) {
    // note that sometimes it starts with 'P' instead of 'PT' for some reason
    if (duration.includes("PT")) {
        // remove 'PT' from the beginning
        duration = duration.substring(2);
    } else {
        // remove 'P' from the beginning
        console.log("this duration starts with 'P' instead of 'PT':", duration)
        return 0;
        // TODO figure out what the heck is happening here
        // duration = duration.substring(1);
    }

    total = 0;
    const indexOfD = duration.indexOf("D");
    const indexOfH = duration.indexOf("H");
    const indexOfM = duration.indexOf("M");
    const indexOfS = duration.indexOf("S");
    let idx = 0;
    if (indexOfD >= 0) {
        const days = duration.slice(idx, indexOfD);
        idx = indexOfD + 1;
        total += parseInt(days) * 24 * 60 * 60;
    }
    if (indexOfH >= 0) {
        const hours = duration.slice(idx, indexOfH);
        idx = indexOfH + 1;
        total += parseInt(hours) * 60 * 60;
    }
    if (indexOfM >= 0) {
        const minutes = duration.slice(idx, indexOfM);
        idx = indexOfM + 1;
        total += parseInt(minutes) * 60;
    }
    if (indexOfS >= 0) {
        const seconds = duration.slice(idx, indexOfS);
        idx = indexOfS + 1;
        total += parseInt(seconds);
    }
    return total;
}

function testFormatting() {
    console.log("testing...");
    console.log(formatVideoDuration("PT2M10S"));
    console.log(formatVideoDuration("PT17S"));
    console.log(formatVideoDuration("PT3M"));
    console.log(formatVideoDuration("PT60M"));
    console.log(formatVideoDuration("PT1H"));
    console.log(formatVideoDuration("PT1H1M1S"));
    console.log(formatVideoDuration("PT1D1H1M1S"));
    console.log(formatVideoDuration("PT1D2H"));
    console.log(formatVideoDuration("PTDT1H51M23S"));
    console.log(formatVideoDuration("PT1D"));
    console.log("testing done.");
}

// example usage:
// download(jsonData, 'json.txt', 'text/plain');
function downloadFile(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function getYoutubeLinkFromId(id) {
    return "https://www.youtube.com/watch?v=" + id;
}