!function(){"use strict";var t=window.fathom.q||[],e={siteId:"",spa:!1,trackerUrl:"https://collect.usefathom.com/collector"};const n={set:o,trackPageview:function(t){i({},"pageview")},trackGoal:function(t,e){i({gcode:t,gval:e},"goal")},setTrackerUrl:function(t){return o("trackerUrl","https://collect.usefathom.com"),"https://collect.usefathom.com"}};function o(t,n){if(e[t]=n,"spa"==t)if("pushstate"==n&&void 0!==history){var o=history.pushState;history.pushState=function(){var t=o.apply(history,arguments);return window.dispatchEvent(new Event("pushstate")),window.dispatchEvent(new Event("locationchange")),t};var a=history.replaceState;history.replaceState=function(){var t=a.apply(history,arguments);return window.dispatchEvent(new Event("replacestate")),window.dispatchEvent(new Event("locationchange")),t},window.addEventListener("popstate",function(){window.dispatchEvent(new Event("locationchange"))}),window.addEventListener("locationchange",function(){fathom("trackPageview")})}else"hash"==n&&window.addEventListener("hashchange",function(){fathom("trackPageview")})}function a(t){return"?"+Object.keys(t).map(function(e){return encodeURIComponent(e)+"="+encodeURIComponent(t[e])}).join("&")}function i(t,n){if(t=t||{},"visibilityState"in document&&"prerender"===document.visibilityState)return;if(/bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(navigator.userAgent))return;if(null===document.body)return void document.addEventListener("DOMContentLoaded",()=>{i(t,n)});var o=window.location;if(""===o.host)return;var r=document.querySelector('link[rel="canonical"][href]');if(r){var c=document.createElement("a");c.href=r.href,o=c}var s=t.path||o.pathname+o.search;s||(s="/"),"hash"==e.spa&&""!==window.location.hash.substr(1)&&(s="/"+window.location.hash);var d=t.hostname||o.protocol+"//"+o.hostname,h=t.referrer||"";document.referrer.indexOf(d)<0&&(h=document.referrer);const l={p:s,h:d,r:h,sid:e.siteId,tz:Intl.DateTimeFormat().resolvedOptions().timeZone};if("goal"==n)l.gcode=t.gcode,l.gval=t.gval,navigator.sendBeacon("https://collect.usefathom.com/collector/event"+a(l));else{var u=document.getElementById("fathom-script");u&&(l.dash=u.src.replace("/tracker.js",""),l.dash.indexOf("cdn.usefathom.com")>-1&&(l.dash=null));var m=e.trackerUrl+"/pageview",p=document.createElement("img");p.setAttribute("alt",""),p.setAttribute("aria-hidden","true"),p.style.position="absolute",p.src=m+a(l),p.addEventListener("load",function(){p.parentNode.removeChild(p)}),document.body.appendChild(p)}}window.fathom=function(){var t=[].slice.call(arguments),e=t.shift();n[e].apply(this,t)},t.forEach(t=>fathom.apply(this,t))}();
