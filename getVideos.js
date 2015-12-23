var google = require('googleapis');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
// var auth = ADD YOUR YOUTUBE API KEY HERE;
var youtube = google.youtube({
  version: 'v3',
  auth: auth
});

var paramsCategories = {
  part: 'snippet',
  regionCode: 'ca',
};

async.waterfall([
  getCategories,
  getVideosPerCategory
], finalCallback);

function getCategories(waterfallNext) {
  var mappedCategories = [];
  youtube.videoCategories.list(paramsCategories, function(err, response) {
    if (err) {
      console.log(err);
    }

    mappedCategories = _.map(response.items, function(item) {
      return {
        channelId: item.snippet.channelId,
        id: item.id,
        title: item.snippet.title
      };
    });

    waterfallNext(null, mappedCategories)
  });
}

function getVideosPerCategory(categories, waterfallNext) {
	var collectedData = {};
	var paramsVideos = {
    part: 'snippet,contentDetails',
    maxResults: 50,
    chart: 'mostPopular',
    regionCode: 'ca',
    fields: 'items'
  };

  async.each(categories, function(category, callback) {
    var arrayOfVideoCounts = [];
    paramsVideos.videoCategoryId = category.id;
    youtube.videos.list(paramsVideos, function(err, response) {

      if (!_.isEmpty(response.items)) {
        arrayOfVideoCounts = _.map(response.items, function(item) {
          return {
            title: item.snippet.title,
            duration: convert_time(item.contentDetails.duration)
          };
        });

        collectedData[category.title] = arrayOfVideoCounts;
        callback(err);

      } else {
        callback(err);
      }

    });
  }, function(err) {
    if (err) console.log(err);

    waterfallNext(null, collectedData);
  });
}

function finalCallback(error, result) {
  console.log(result);

}

function convert_time(duration) {
  var a = duration.match(/\d+/g);

  if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
    a = [0, a[0], 0];
  }

  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
    a = [a[0], 0, a[1]];
  }
  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
    a = [a[0], 0, 0];
  }

  duration = 0;

  if (a.length == 3) {
    duration = duration + parseInt(a[0]) * 3600;
    duration = duration + parseInt(a[1]) * 60;
    duration = duration + parseInt(a[2]);
  }

  if (a.length == 2) {
    duration = duration + parseInt(a[0]) * 60;
    duration = duration + parseInt(a[1]);
  }

  if (a.length == 1) {
    duration = duration + parseInt(a[0]);
  }
  return duration
}
