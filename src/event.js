var terms = [];
const SPREADSHEET_ID = '1BQwdvEIyJHJt2xn3jH8MZ2qYhR3UrhnpTGI0-3hvX8w';
const FIELDS = ['term', 'description', 'image'];

function parseRow(row) {
  // parse a GSX (Google Spreadsheet)
  // row into something nicer
  var obj = {};
  Object.keys(row).map(k => {
    var v = row[k];
    if (k.startsWith('gsx$')) {
      var field = k.replace('gsx$', '');
      obj[field] = v.$t;
    }
  });
  return obj;
}


const sheet = {
  load: function(id, num, onLoad) {
    var url = `https://spreadsheets.google.com/feeds/list/${id}/${num}/public/full?alt=json`;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var data = JSON.parse(xhr.responseText);
            onLoad(data.feed.entry.map(parseRow))
        }
    }
    xhr.send();
  },

}

sheet.load(SPREADSHEET_ID, 1, rows => {
  // map long google spreadsheet field names
  // to more readable ones
  var key_map = {};
  Object.keys(rows[0]).map(k => {
    for (var i=0; i < FIELDS.length; i++) {
      if (k.startsWith(FIELDS[i])) {
        key_map[k] = FIELDS[i];
        break;
      }
    }
  });

  // clean up row data
  rows.map(r => {
    var term = {};
    Object.keys(r).map(k => {
      var k_ = key_map[k];
      term[k_] = r[k];
    });
    terms.push(term);
  });
  // console.log(terms); // DEBUG
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg == 'terms') {
      sendResponse({terms: terms});
    }
  }
);
