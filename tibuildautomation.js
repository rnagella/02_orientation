/*jslint devel: true, node: true, bitwise: false, debug: false, eqeq: false,
evil: false, forin: false, newcap: false, nomen: false, plusplus: false,
regexp: false, sub: false, vars: false, undef: false, unused: false,
white: false, quotmark: single, indent: 2, maxlen: 80 */

'use strict';

// node built in libraries.
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var stdin = process.openStdin();
var path = require('path');

// node modules.
var _ = require('underscore');

// helper libraries
var strings = require('./strings.js');

// output result to standard console.
function puts(error, stdout, stderr) {

  sys.puts(stdout);
}

// path where your Android apk is build with Titanium.
// absolute paths
var androidSrcPath = strings.androidSrcPath,
    androidSrcFilename = strings.androidSrcFilename,
    androidDestPath = path.resolve(process.cwd(),
        strings.androidDestPath),
    androidDestFilename = strings.androidDestFilename,
    remaxMaxVersionNumber = strings.remaxMaxVersionNumber,
    unencryptedPath = path.resolve(process.cwd(),
    strings.unencryptedPath),
    unencryptedFilename = strings.unencryptedFilename;

var commands = {

  'git' : function () {

    exec('git pull', puts);
    // add a promise here.
    exec('git status', puts);
  },
  'build' : function (args) {
    // cmd : build <android | iphone | ipad>
    // build for android, ios, iphone, ipad -
    // defaulted to android in this case.

    var buildDevice = (args[0] || 'android' || 'iphone' || 'ipad');
    exec('titanium build -p ' +  buildDevice + ' -b', puts);
  },
  'copy' : function () {
    // from - androidSrcPath + androidSrcFilename
    fs.readFile(androidSrcPath + androidSrcFilename, function (err, data) {

      if (err) throw err;

      // var androidDestFilename;
      fs.readdir(androidDestPath, function (err, files) {

        var version, versionNum = [];

        _.each(files, function (file) {
          version = file.split('-')[4];

          if (version) {
            versionNum.push((+(version).split('.')[2]));
          }
        });

        remaxMaxVersionNumber = (+_.max(versionNum));
        androidDestFilename =
        'homes-app-remax-alloy-v0.2.' + (remaxMaxVersionNumber + (+1)) + '.apk';

        // write 'data' to (destination)
        // -  androidDestPath + androidDestFilename
        fs.writeFile(androidDestPath + '/' + androidDestFilename, data,
          function (err) {
          if (err) throw err;
          console.log('copy completed.');
        });

      });
    });
  },
  'append' : function () {
    // append : appends the link, version entry
    // to apps.html
    var unencryptedData, length, remaxHttpLink;
    unencryptedData = require(unencryptedPath + unencryptedFilename).apps;

    if (unencryptedData[0].name === 'Remax') {

      if (unencryptedData[0].Versions[1].name === 'Android') {

        // add dynamically.
        remaxHttpLink =
        '{"link":"http://apptest.homes.com/remax/v2.0/android/' +
        'homes-app-remax-alloy-v0.2.' + (remaxMaxVersionNumber + (+1)) +
        'apk","version":"v0.2.' + (remaxMaxVersionNumber + (+1)) + '"}';

        length = unencryptedData[0].Versions[1].links.length;
        unencryptedData[0].Versions[1].links[length] =
            JSON.parse(remaxHttpLink);

        // Writing as a Javascript export variable.
        unencryptedData = 'var apps = ' +
                      JSON.stringify(unencryptedData, null, 2) +
                      ';exports.apps = apps;';


        // Write to - unencryptedPath + unencryptedFilename with
        // updated unencryptedData.
        fs.writeFile(unencryptedPath + unencryptedFilename, unencryptedData,
          function (err) {
          if (err) throw err;
          console.log('update complete');
        });
      }

    }
  }
};

console.log('Enter Your Choice.\n' +
  '1. Pull latest code from git');

stdin.on('data', function (input) {
  console.log('User Choice is ' + input.toString());
  var
  matches = input.toString().match(/(\w+)(.*)/),
  command = matches[1].toLowerCase(),
  args = matches[2].trim().split(/\s+/);
  commands[command](args);
});
