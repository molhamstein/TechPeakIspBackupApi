'use strict';
var schedule = require('node-schedule');

const fs = require('fs');
var request = require('request');


module.exports = function (Client) {
  let rawdata = fs.readFileSync('server/configISP.json');
  let dataInJson = JSON.parse(rawdata);


  var accessToken = "";
  logIn();

  function appendToFile(text) {
    // fs.appendFile('log/log.txt', text + "\r\n", function (err) {
    //   if (err) throw err;
    // });
  }

  function getData() {
    Client.find({
      limit: 1,
      order: 'update_at DESC',
    }, function (err, lastUser) {
      var url;
      console.log(lastUser);
      if (lastUser[0] == null)
        var url = dataInJson['host'] + 'api/clients/onlineUsersIsp?isExport=2&access_token=' + accessToken;

      else {
        var from = new Date(lastUser[0].update_at.toGMTString());
        var url = dataInJson['host'] + 'api/clients/onlineUsersIsp?from=' + from.getUTCFullYear() + "-" + (from.getUTCMonth() + 1) + "-" + from.getUTCDate() + " " + from.getUTCHours() + ":" + from.getMinutes() + ":" + from.getSeconds() + '&isExport=2&access_token=' + accessToken
      }
      console.log(url);
      request(url, function (error, response, body) {
        if (!error) {
          var mainBody = JSON.parse(body)
          console.log(mainBody);
          mainBody.forEach(function (element) {

            if (element.acctstoptime != null) {
              appendToFile("client" + JSON.stringify(element))
              appendToFile("go to update" + element.radacctid)
              update(element);
            } else {
              appendToFile("go to add" + element.radacctid)

              add(element);
            }
          }, this);

        } else {
          logIn();
        }
      });
    })
  }
  // iFrZ3H7C29alZ5ORpK3gHnhXWXnUdEpryX8m0gUJqyPmgDDeFlln6GTTLdhzSZ9T

  function logIn() {
    request.post(dataInJson['host'] + 'api/ISP/login', {
      json: dataInJson['loginData']
    }, (error, res, body) => {
      if (error) {
        console.error(error)
        return
      }
      accessToken = body['id']
    })
  }
  var timer = schedule.scheduleJob('0 * * * * *', function () {
    getData();
  });

  var timer = schedule.scheduleJob('15 * * * * *', function () {
    getData();
  });

  var timer = schedule.scheduleJob('30 * * * * *', function () {
    getData();
  });

    var timer = schedule.scheduleJob('45 * * * * *', function () {
    getData();
  });

  function update(element) {
    Client.findOne({
      radacctid: element.radacctid
    }, function (err, oneClient) {
      if (err)
        console.log(err);
      else {

        if (oneClient!=null && oneClient[0] != null) {
          oneClient.update_at = element.update_at;
          oneClient.acctstoptime = element.acctstoptime;
          oneClient.save();
          appendToFile("update:" + oneClient.radacctid)
        } else {
          appendToFile("go to add from update" + element.radacctid)
          Client.create(element, function (err, newClient) {
            if (err)
              console.log(err);
            else
            appendToFile("add from update:" + JSON.stringify(newClient))

          })
        }
      }
    })
  }

  function add(element) {
    Client.findOne({
      radacctid: element.radacctid
    }, function (err, oneClient) {
      if (oneClient == null) {
        Client.create(element, function (err, oneClient) {
          // console.log("added")
          appendToFile("add:" + oneClient.radacctid)

        })
      } else {
        appendToFile("add is Field:" + oneClient.radacctid)

      }
    })

  }
};
