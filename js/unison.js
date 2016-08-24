/*jshint indent:2 */
/*global define */
(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return (root.Unison = factory());
    });
  } else {
    root.Unison = factory();
  }
}(this, function () {
  'use strict';

  if(typeof window === 'undefined') return;

  var win = window;
  var doc = document;
  var head = doc.head;
  var eventCache = {};
  var unisonReady = false;
  var currentBP;

  var util = {
    parseMQ: function (el) {
      var str = win.getComputedStyle(el, null).getPropertyValue('font-family');
      return str.replace(/"/g, '').replace(/'/g, '');
    },
    debounce: function (func, wait, immediate) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        }, wait);
        if (immediate && !timeout) {
          func.apply(context, args);
        }
      };
    },
    isObject: function (e) {
      return typeof e === 'object';
    },
    isUndefined: function (e) {
      return typeof e === 'undefined';
    },
    isUnisonReady: function () {
      return win.getComputedStyle(head, null).getPropertyValue('clear') !== 'none';
    },
    initializeUnison: function () {
      unisonReady = util.isUnisonReady();
      breakpoints.update();
    }
  };

  var events = {
    on: function (event, callback) {
      if (!util.isObject(eventCache[event])) {
        eventCache[event] = [];
      }
      eventCache[event].push(callback);
    },
    off: function(event, callback) {
      if (!event) return eventCache = [];
      if (util.isObject(eventCache[event])) {
        if (!callback) return delete eventCache[event];
        for (var i = 0; i < eventCache[event].length; i++) {
          if (callback === eventCache[event][i]) {
            eventCache[event].splice(i,1);
            if (!eventCache[event].length) delete eventCache[event];
            return;
          }
        }
      }
    },
    emit: function (event, data) {
      if (util.isObject(eventCache[event])) {
        var eventQ = eventCache[event].slice();
        for (var i = 0; i < eventQ.length; i++) {
          eventQ[i].call(this, data);
        }
      }
    }
  };

  var breakpoints = {
    all: function () {
      var BPs = {};
      var allBP = util.parseMQ(doc.querySelector('title')).split(',');
      for (var i = 0; i < allBP.length; i++) {
        var mq = allBP[i].trim().split(' ');
        BPs[mq[0]] = mq[1];
      }
      return ( unisonReady ) ? BPs : null;
    },
    now: function (callback) {
      var nowBP = util.parseMQ(head).split(' ');
      var now = {
        name: nowBP[0],
        width: nowBP[1]
      };
      return ( unisonReady ) ? (( util.isUndefined(callback) ) ? now : callback(now)) : null;
    },
    update: function () {
      breakpoints.now(function (bp) {
        if (bp.name !== currentBP) {
          events.emit(bp.name);
          events.emit('change', bp);
          currentBP = bp.name;
        }
      });
    }
  };

  win.onresize = util.debounce(breakpoints.update, 100);
  doc.addEventListener('DOMContentLoaded', function () {
    util.initializeUnison();
  });

  return {
    fetch: {
      all: breakpoints.all,
      now: breakpoints.now
    },
    on: events.on,
    off: events.off,
    emit: events.emit,
    util: {
      initializeUnison: util.initializeUnison,
      debounce: util.debounce,
      isObject: util.isObject
    }
  };
}));
