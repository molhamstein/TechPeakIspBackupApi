'use strict';
var schedule = require('node-schedule');

const fs = require('fs');
var request = require('request');


module.exports = function (Client) {
  let rawdata = fs.readFileSync('server/configISP.json');
  let dataInJson = JSON.parse(rawdata);
  console.log(dataInJson);


  var accessToken = "";
  logIn();

  function getData() {
    Client.find({
      limit: 1,
      order: 'update_at DESC',
    }, function (err, lastUser) {
      var url;
      console.log(lastUser);
      if (lastUser[0] == null)
        var url = dataInJson['host']+'api/clients/onlineUsersIsp?isExport=2&access_token=' + accessToken;

      else {
        var from = new Date(lastUser[0].update_at.toGMTString());
        var url = dataInJson['host']+'api/clients/onlineUsersIsp?from=' + from.getUTCFullYear() + "-" + (from.getUTCMonth() + 1) + "-" + from.getUTCDate() + " " + from.getUTCHours() + ":" + from.getMinutes() + '&isExport=2&access_token=' + accessToken
      }
      console.log(url);
      request(url, function (error, response, body) {
        if (!error) {
          var mainBody = JSON.parse(body)
          console.log("mainBody");
          console.log(mainBody);
          for (var index = 0; index < mainBody.length; index++) {
            var element = mainBody[index];
            if (element.acctstoptime != null) {
              update(element);
            } else {
              add(element);
            }
          }
        } else {
          console.log(error)
          logIn();
        }
      });
    })
  }
  // iFrZ3H7C29alZ5ORpK3gHnhXWXnUdEpryX8m0gUJqyPmgDDeFlln6GTTLdhzSZ9T

  function logIn() {
    request.post(dataInJson['host']+'api/ISP/login', {
      json: dataInJson['loginData']
    }, (error, res, body) => {
      if (error) {
        console.error(error)
        return
      }
      console.log(`statusCode: ${res.statusCode}`)
      console.log(body)
      accessToken = body['id']
    })
  }
  var timer = schedule.scheduleJob('0 * * * * *', function () {
    getData();
  });

  var timer = schedule.scheduleJob('15 * * * * *', function () {
    getData();
  });


  function update(element) {
    Client.findOne({
      radacctid: element.radacctid
    }, function (err, oneClient) {
      if (oneClient != null) {
        oneClient.update_at = element.update_at;
        oneClient.acctstoptime = element.acctstoptime;

        // console.log("Update")
        // console.log("----------------------------")
        // console.log(element.radacctid)
        // console.log("----------------------------")
        oneClient.save();
      } else {
        add(element);
      }
    })
  }

  function add(element) {
    Client.findOne({
      radacctid: element.radacctid
    }, function (err, oneClient) {
      if (oneClient == null) {
        Client.create(element, function (err, oneClient) {
          //   console.log("added")
        })
      }
    })

  }
};
