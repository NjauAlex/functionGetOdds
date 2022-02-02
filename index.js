const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.database();
const axios = require('axios')
    //Get a database reference to Date
const dateRef = db.ref('ApiDate');

var firstTime = true;
const ApiOdds = db.ref('ApiOdds');

const headers = {
    'x-rapidapi-key': 'd8f513e7c271566e0589a163d227f789',
    'x-rapidapi-host': 'v3.football.api-sports.io'
}
exports.functionGetOdds = functions.runWith({
        // Ensure the function has enough memory and time
        // to process large files
        timeoutSeconds: 540,
        memory: "8GB",
    }).pubsub.schedule('5 8* * *')
    .timeZone('Africa/Cairo') // Users can choose timezone - default is America/Los_Angeles
    .onRun((context) => {
           dateRef.once('value', (data) => {
            // do some stuff once
            var date = data.val();
            CallApi(date)
        });
});


var getUrl = ''
var page = 1;
var oddsList;

var totalPages;
   

function getPages(totalPages) {
    var page = 1;
    if (totalPages > 40 && totalPages < 51) {
        page = 21;
    } else if (totalPages > 50 && totalPages < 61) {
        page = 31;
    } else if (totalPages > 60 && totalPages < 71) {
        page = 41;
    } else if (totalPages > 70 && totalPages < 81) {
        page = 51;
    } else if (totalPages > 80 && totalPages < 91) {
        page = 61;
    } else if (totalPages > 100) {
        page = 71
    }
    console.log(" Get Page: page is " + page)
    return page;
}

function getTotalPages(totalPages) {
    switch (totalPages) {
        case 39:
            totalPages = totalPages - 1;
            break;
        case 40:
            totalPages = totalPages - 2;
            break;
        case 69:
            totalPages = totalPages - 1;
            break;
        case 70:
            totalPages = totalPages - 2;
            break;
        case 49:
            totalPages = totalPages - 1;
            break;
        case 50:
            totalPages = totalPages - 2;
            break;
        case 59:
            totalPages = totalPages - 1;
            break;
        case 60:
            totalPages = totalPages - 2;
            break;
        case 79:
            totalPages = totalPages - 1;
            break;
        case 80:
            totalPages = totalPages - 2;
            break;
        case 89:
            totalPages = totalPages - 1;
            break;
        case 90:
            totalPages = totalPages - 2;
            break;
        default:
            console.log("no need to change the total pages")
            totalPages = totalPages;
    }
    return totalPages;
}

function CallApi(mApiDate) {
    if (firstTime) {
        console.log('Get Odds date is ' + mApiDate + " Instance is " + Math.random(9))
    }

    getUrl = "https://v3.football.api-sports.io/odds?timezone=Africa/Cairo&date=" + mApiDate + "&page=" + page + "&bookmaker=8";

    axios.get(getUrl, {
        headers: headers
    }).then((response) => {
        var list = response.data.response;
        if (firstTime) {
            totalPages = getTotalPages(response.data.paging.total);
            page = getPages(totalPages)
            console.log('current page is ' + page + ' and total pages is ' + totalPages)
            oddsList = list;
            firstTime = false;
        } else {
            oddsList = [...oddsList, ...list];
        }
        page++;
        if ((page % 10 == 0) && (page <= totalPages)) {
            //calling the tenth time wait a minute and call again
            setTimeout(CallApi.bind(null, mApiDate), 75000); // correct way
        } else if (!(page % 10 == 0) && (page <= totalPages)) {
            CallApi(mApiDate);
        } else {
            //done getting odds upload the odds list to firebase
            console.log('current page is ' + page + ' and total pages is ' + totalPages)
          return  ApiOdds.set(oddsList)
        }

    }).catch((error) => {
        console.log("error in getting odds" + error + ' while at page ' + page + ' and total page is ' + totalPages)
    })
}
