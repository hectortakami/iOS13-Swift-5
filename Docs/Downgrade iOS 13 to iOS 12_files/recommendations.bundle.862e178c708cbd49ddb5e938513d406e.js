"use strict";define("recommendations/models",["backbone","moment","core/time"],function(a,b,c){var d=function(a){var d=a.prototype;return a.extend({defaults:{sourceThreadId:null,forumId:null,forum:null,threadForum:null,requestBin:null,createdAgo:!1},initialize:function(a,d){if(this.set("threadForum",a.forum),d&&d.humanFriendlyTimestamp){var e=c.assureTzOffset(this.get("createdAt"));e=b(e,c.ISO_8601),this.set("createdAgo",e.fromNow())}},toJSON:function(){var a=d.toJSON.call(this);return a.preview&&(a.preview=a.preview.toJSON()),a},toString:function(){return"organic link: "+this.get("title")+" "+this.get("link")+" (id = "+this.id+")"}})}(a.Model);return{RelatedThread:d}}),define("recommendations/collections",["underscore","backbone","loglevel","moment","core/api","core/utils/html","recommendations/models"],function(a,b,c,d,e,f,g){var h=b.Collection.extend({url:e.getURL("discovery/listTopPost.json"),parse:function(a){for(var c=b.Collection.prototype.parse.call(this,a),d=0,e=c.length;d<e;d++)c[d].plaintext=f.stripTags(c[d].message);return c}}),i=b.Collection.extend({url:e.getURL("discovery/listRecommendations.json"),initialize:function(a,b){this.model=g.RelatedThread,this.name=b.name,this.minLength=b.minLength,this.maxLength=b.maxLength,this.settings=b.settings,this.forumUrl=b.forumUrl},addClickMetadata:function(a){this.invoke("set",a)},fetch:function(a,e){if(a.data.limit=this.maxLength,this.settings.maxAgeDays>0){var f=d().subtract(this.settings.maxAgeDays,"days");a.data.since=f.startOf("hour").toISOString()}var g=Promise.resolve(b.Collection.prototype.fetch.call(this,a)),h=this;return e&&(g=g.then(function(){return h.getFeaturedPosts()["catch"](function(a){c.info("There was a problem fetching featured posts: ",a)})})),g},parse:function(a){var c=this,d=b.Collection.prototype.parse.call(this,a).filter(function(a){return Boolean(a.id)&&Boolean(a.images.length)&&Boolean(a.title)&&Boolean(a.description)&&Boolean(a.url)});return c.forumUrl?(c.forumUrl=c.forumUrl.replace(/(^\w+:|^)\/\/(www\.)?/,"").split("/")[0],d.filter(function(a){return a.url.indexOf(c.forumUrl)>-1})):d},getFeaturedPosts:function(){var b=this.map(function(a){return parseInt(a.get("id"),10)});if(b.length<this.minLength)return Promise.resolve();b.sort(function(a,b){return a-b});var c=Promise.resolve(this.previews.fetch({data:{thread:b},timeout:i.CONTENT_PREVIEWS_FETCH_TIMEOUT}));return c.then(a.bind(this.attachPreviews,this))},attachPreviews:function(){this.previews.each(function(a){var b=a.get("thread"),c=this.get(b);c&&c.set("preview",a)},this)}},{CONTENT_PREVIEWS_FETCH_TIMEOUT:5e3}),j={PostCollection:h,RelatedThreadCollection:i};return j}),define("recommendations/helpers",["underscore","jquery","loglevel"],function(a,b,c){var d=function(d,e){function f(){return j.scrollHeight-j.offsetHeight>.2*k}function g(){i.lastChild&&!a.contains(["...","…"],i.lastChild.nodeValue)&&(l=i.appendChild(window.document.createTextNode(" "+o)),f()&&(i.removeChild(l),i.removeChild(i.lastChild),g()))}if(!d.closest("body").length)return void c.info("lineTruncate called on el not on DOM");if(d.text().length<1)return void c.info("lineTruncated called on empty el");var h=function(a){return 3!==a.nodeType};if(a.any(d.children(),h))return void c.info("lineTruncate called on non-flat el");var i=d[0],j=i;if("block"!==d.css("display"))for(;j.parentNode&&(j=j.parentNode,"block"!==b(j).css("display")););var k=parseFloat(d.parent().css("font-size"),10);if(f()){e=e||{};var l,m,n=e.lines||1,o=e.ellipsis,p=d.text();if(p.length){var q=d.width()/k,r=parseInt(q*n,10),s=p.split(/\s/),t=0;d.empty();var u=s.length;for(m=0;m<u&&(t+=s[m].length+1,!(t>=r));m++)0!==m&&(s[m]=" "+s[m]),i.appendChild(window.document.createTextNode(s[m]));if(f())for(;i.lastChild&&f();)l=i.removeChild(i.lastChild);else{do l=i.appendChild(window.document.createTextNode(" "+s[m])),m+=1;while(!f()&&m<u);i.removeChild(l)}o&&(a.isString(o)||(o="…"),g())}}},e=["product","zone","service","experiment","variant"],f=function(b){b=b||"";var c=a.object(e,b.split(":"));return{bin:b,experiment:c.experiment||"",variant:c.variant||""}};return{lineTruncate:d,binToEventParams:f}}),define("recommendations/models/State",["backbone"],function(a){var b={UNTOUCHED:1,PROCESSING:2,DONE:4};return a.Model.extend({defaults:{status:b.UNTOUCHED,placement:null,error:null},isResolved:function(){return this.isDone()&&!this.get("error")},isRejected:function(){return this.isDone()&&this.get("error")},isDone:function(){return this.get("status")===b.DONE}},{STATUS:b})}),define("recommendations/models/Container",["underscore","backbone","core/analytics/jester","common/Session","recommendations/helpers","recommendations/models/State"],function(a,b,c,d,e,f){return b.Model.extend({initialize:function(b){var c=this;c.app=b.app,c.threads=b.threads,c.collections=[],a.bindAll(c,"prepareData","validateCollectionMin"),c.set("sectionNames",["col-organic"]),c.set("sectionIds",a.map(c.get("sectionNames"),function(a){return a+"-"+c.cid})),c.collections.push(this.threads),this.state=new f,c.threads&&c.threads.each(function(a){a.state=c.state})},validateCollectionMin:function(){for(var a=this.collections,b=this.get("sectionNames").slice(0),c=this.get("sectionIds").slice(0),d=a.length;d>0;){d-=1;var e=a[d];e.length<e.minLength&&(a.splice(d,1),b.splice(d,1),c.splice(d,1),d=a.length)}this.set("sectionNames",b),this.set("sectionIds",c)},prepareData:function(){var a=this.commonClickMetadata();this.threads.addClickMetadata(a)},validateData:function(){this.validateCollectionMin(),this.prepareData()},commonClickMetadata:function(){var a=this.app,b=a.get("sourceForum"),c={sourceThreadId:a.get("sourceThread").id,forumId:b.pk,forum:b.id,requestBin:a.get("requestBin")};return d.isKnownToBeLoggedOut()||(c.userId=d.fromCookie().id),c},report:function(b){a.isEmpty(b)||c.client.emit(a.extend(this.snapshot(),b))},snapshot:function(){var b=this.threads,c=this.app,f=e.binToEventParams(c.get("requestBin")),g=d.isKnownToBeLoggedOut()?{}:{userId:d.fromCookie().id},h=a.extend({internal_organic:b&&b.length,external_organic:0,promoted:0,display:!0,placement:this.state.get("placement"),zone:"thread",area:this.state.get("placement"),thread_id:c.get("sourceThread").id,forum_id:c.get("sourceForum").pk},g,f,{object_type:"link"});return h}})});var _extends=Object.assign||function(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)Object.prototype.hasOwnProperty.call(c,d)&&(a[d]=c[d])}return a};define("templates/recommendations/recommendationsCollection",["underscore","react","core/strings","core/utils/object/get"],function(a,b,c,d){var e=c.gettext,f=function(c){return a.map(c.collection,function(a,d){return b.createElement(g,{index:d,post:a,settings:c.settings})})},g=function(a){var c=a.index,f=a.post,g=a.settings;return b.createElement("div",{className:"recommend-post post-"+c,id:"recommend-link-"+f.domIdSuffix,"data-role":"recommended-post","data-link":f.recommendationLink},b.createElement("header",{className:"recommend-post-header"},b.createElement("div",{className:"recommend-image-wrapper"},b.createElement("img",{src:f.images[0].url,alt:f.title,title:f.title}),b.createElement("span",{className:"overlay"})),g.disableOverlay?null:b.createElement("h3",{className:"recommend-post-title",title:f.title},b.createElement("span",{"data-role":"recommend-thread-title",className:"title line-truncate","data-line-truncate":d(g,["numLinesHeadline"],""),"data-content":f.title,dangerouslySetInnerHTML:{__html:f.title}}))),b.createElement("ul",{className:"meta"},g.metaDate?b.createElement("li",{className:"time"},f.createdAgo):null," ",g.metaComments&&f.posts>0?b.createElement("li",{className:"comments"},1===f.posts?e("1 comment"):e("%(numPosts)s comments",{numPosts:f.posts})," "):null),g.contentPreview?b.createElement(h,_extends({settings:g},f)):null,g.featuredComment&&!g.contentPreview?b.createElement(i,f):null)},h=function(a){return b.createElement("div",{className:"content-preview-wrapper"},b.createElement("div",{className:"recommend-content"},a.settings.titleHidden||!a.settings.disableOverlay?b.createElement("span",{"data-role":"recommend-description-snippet",className:"line-truncate","data-line-truncate":"5"},a.description):b.createElement("h3",{className:"recommend-post-title",title:a.title},b.createElement("span",{"data-role":"recommend-thread-title",className:"title line-truncate","data-line-truncate":3,"data-content":a.title,dangerouslySetInnerHTML:{__html:a.title}}))))},i=function(a){return b.createElement("div",{className:"top-comment","data-role":"recommend-top-comment"},b.createElement("div",{className:"top-comment-header"},b.createElement("span",{className:"top-comment-avatar-wrapper"},b.createElement("img",{"data-src":d(a.preview,["author","avatar","cache"],""),alt:e("Avatar"),"data-role":"recommend-avatar"})),b.createElement("span",{className:"user publisher-color","data-role":"recommend-top-comment-author"},d(a.preview,["author","name"],null))),b.createElement("div",{className:"recommend-top-comment-wrapper"},b.createElement("span",{"data-role":"recommend-top-comment-snippet",className:"line-truncate","data-line-truncate":"3",dangerouslySetInnerHTML:{__html:d(a.preview,["message"],null)}})))};return f}),define("recommendations/views/links/BaseCollectionView",["underscore","jquery","backbone","react","react-dom","recommendations/helpers","templates/recommendations/recommendationsCollection"],function(a,b,c,d,e,f,g){var h=c.View.extend({events:{"click [data-redirect]":"handleClick"},handleClick:function(a){this.swapHref(a.currentTarget)},swapHref:function(b){b.setAttribute("data-href",b.getAttribute("href")),b.setAttribute("href",b.getAttribute("data-redirect")),a.delay(function(){b.setAttribute("href",b.getAttribute("data-href"))},100)},initialize:function(a){this.elementsSelector="div.recommend-post",this.$elements=this.$el.find(this.elementsSelector),this.initContext=a.context,this.settings=a.settings,this.adSupported=a.adSupported;var b=this.collection;this.listenTo(b,{remove:this.remove,reset:this.render})},truncate:function(){var c=this.$el.find(".line-truncate");a.each(c,function(a){var c=b(a);f.lineTruncate(c,{lines:parseInt(c.attr("data-line-truncate"),10),ellipsis:!0})})},metaPlacement:function(){var c=this.$el.find(".meta"),d=this.$el.find(".recommend-post-title");c.length&&"absolute"===b(c[0]).css("position")&&a.each(c,function(a,c){var e="10px";if(d.length){var f=b(d[c]),g=parseInt(f.context.offsetHeight,10),h=Math.ceil(parseFloat(f.css("line-height"))),i=5;e=(h/2+g+i).toString()+"px"}b(a).css({bottom:e})})},resizeImage:function(a){var b=200,c=200,d=0,e=a.images[0];return e.width>b&&e.height>c?e.height<e.width?(d=c/e.height,e.height=c,e.width*=d,e.url+="&h="+e.height):(d=b/e.width,e.width=b,e.height*=d,e.url+="&w="+e.width):e.size||(e.url+="&h="+c),a.image=e,a},getTemplateContext:function(){this.appContext||(this.appContext=this.model.app.toJSON()),this.settings=a.extend(this.settings,this.appContext);var b=a.extend({settings:this.settings},this.initContext);b.collection=this.collection.toJSON();var c=a.bind(this.resizeImage);b.collection=b.collection.reduce(function(a,b){return a.push(c(b)),a},[]);var d=this.collection.at(0);if(d){var e=d.has("id")?"organic-":"promoted-",f=d.idAttribute;a.each(b.collection,function(a){a.advertisement_id=a[f],a.domIdSuffix=a[f],a.domIdSuffix=e+a.domIdSuffix,a.recommendationLink=a.url})}return b},render:function(){var a=this.getTemplateContext();return this.el.children.length||e.render(d.createElement(g,a),this.el),this.$elements=this.$el.find(this.elementsSelector),this.truncate(),this.metaPlacement(),this},remove:function(d,e,f){if(0===arguments.length)return c.View.prototype.remove.call(this);var g=a.toArray(this.$elements),h=g.splice(f.index,1)[0];return b(h).remove(),this.$elements=b(g),this}});return h}),define("templates/recommendations/recommendationsMain",["underscore","react","core/strings","core/utils/object/get"],function(a,b,c,d){var e=c.gettext,f=function(c){var f=c.settings.contentPreview?"":"no-preview";f=c.settings.titleHidden||!c.settings.disableOverlay?f:"has-preview-title";var g=c.settings.metaDate||c.settings.metaComments?"":"no-meta";return b.createElement("div",{id:c.id,className:"recommend-main "+f+" "+g},a.map(c.sections,function(a){return b.createElement("section",{id:a.id,className:a.className},b.createElement("header",{className:"recommend-col-header"},b.createElement("h2",null,e("Also on %(forumName)s",{forumName:b.createElement("strong",null,d(c.forum,["name"],null))}))),b.createElement("div",{className:"recommendations-unit "+(c.adSupported?"ad-supported":"")},b.createElement("div",{className:"recommendation-static-ad-wrapper"},b.createElement("div",{className:"recommend-static-ad","data-role":"recommendations-ad"})),b.createElement("div",{className:"recommendation-container"},b.createElement("button",{className:"scroll-btn scroll-left","data-action":"scroll-left"},"❮"),b.createElement("div",{className:"recommend-wrapper"},b.createElement("div",{className:"recommend-posts","data-role":"recommend-posts"})),b.createElement("button",{className:"scroll-btn scroll-right","data-action":"scroll-right"},"❯"))))}))};return f}),define("recommendations/views/links/MainView",["jquery","underscore","backbone","core/bus","recommendations/views/links/BaseCollectionView","templates/recommendations/recommendationsMain"],function(a,b,c,d,e,f){var g=c.View.extend({events:{"click [data-role=recommended-post]":"handleClick","click [data-action=scroll-left]":"clickScrollLeft","click [data-action=scroll-right]":"clickScrollRight"},topEdgeOffset:0,bottomEdgeOffset:1/0,initialize:function(a){a=a||{},this.settings=a.settings,this.adSupported=a.adSupported},handleClick:function(b){var c=a(b.currentTarget),e=c.data("link");d.trigger("uiAction:recommendationsClick",e),b.stopPropagation(),window.open(e,"_blank")},clickScrollLeft:function(){this.scroll(-1)},clickScrollRight:function(){this.scroll(1)},scroll:function(b){var c=a(this.$el.find(".recommend-wrapper")[0]),d=a(this.$el.find(".recommend-posts")[0]),e=this.$el.find(".recommend-post").length,f=d.width()/e,g=2*f,h=700;c.width()<g&&(g=f,h/=2);var i=c.scrollLeft()+g*b;c.animate({scrollLeft:i},h)},createSections:function(){var a=this.model,c=a.get("sectionNames"),d=a.get("sectionIds");return b.map(a.collections,function(a,b){return{id:d[b],className:c[b],collection:a}})},getTemplateContext:function(){var a=this.model.app,b=this.createSections();return{id:a.get("innerContainerId"),sections:b,forum:a.get("sourceForum")}},render:function(){var c=this;return c.model.validateData(),c.renderViews(),c.resizeHandler=b.debounce(function(){c.views&&b.invoke(c.views,"render")},100),a(window).on("resize",c.resizeHandler),this},renderViews:function(){var c=this.getTemplateContext(),d=this;c.settings=d.settings,c.adSupported=d.adSupported,this.$el.html(f(c)),this.$el.addClass("recommendations-wrapper");var g=b.map(c.sections,function(b){return new e({model:d.model,collection:b.collection,settings:c.settings,adSupported:c.adSupported,el:a("#"+b.id+" [data-role=recommend-posts]"),context:{}})}),h=this.$el.width(),i=20;this.$el.width(h-i),b.invoke(g,"render"),this.$el.width("100%");var j=g[0].$el.width();j<=h&&this.$el.find(".scroll-btn").hide(),this.views=g},remove:function(){c.View.prototype.remove.call(this),this.resizeHandler&&a(window).off("resize",this.resizeHandler)}});return g}),define("recommendations/views/Placement",["backbone","recommendations/views/links/MainView"],function(a,b){var c=a.View.extend({className:"post-list",initialize:function(a){a=a||{},this.placement=a.placement,this.settings=a.settings,this.adSupported=a.adSupported,this.sourceThreadUrl=a.sourceThreadUrl,this._enabled=!0,this._collapse()},setRequestBin:function(a){this._bin=a},tryPlacement:function(a){this._unsetView(),a.state.set("placement",this.placement),this._recommendations=new b({model:a,settings:this.settings,adSupported:this.adSupported,sourceThreadUrl:this.sourceThreadUrl}),this.$el.html(this._recommendations.el),this._recommendations.render(),this._expand()},getCurrentUnit:function(){return this._recommendations},disable:function(){this._enabled=!1,this._collapse()},enable:function(){this._enabled=!0,this._expand()},remove:function(){return this._unsetView(),a.View.prototype.remove.apply(this,arguments)},_unsetView:function(){this._recommendations&&(this._recommendations.model.state.unset("placement"),this._recommendations.remove(),this._recommendations=null)},_expand:function(){this._enabled&&(this.$el.css({height:"auto",visibility:"visible"}),this.trigger("recommendations:expanded"))},_collapse:function(){this.$el.css({height:0,visibility:"hidden"})}});return c}),define("recommendations/main",["backbone","underscore","jquery","loglevel","common/Session","core/api","recommendations/collections","recommendations/models/Container","recommendations/views/Placement"],function(a,b,c,d,e,f,g,h,i){var j={},k=1e4;return j.RecommendationsApp=a.Model.extend({defaults:{name:"default",featuredComments:!1,sourceThread:null,sourceForum:null,sourceThreadUrl:null,minLength:4,maxLength:8,innerContainerName:"recommend-main",lineTruncationEnabled:!0,numLinesHeadline:3,adSupported:!1},initialize:function(){var a=this;a.session=e.get(),f.call("discovery/details.json",{data:{forum:a.get("sourceForum").id}}).success(function(b){var c=b.response,d={contentPreview:c.content_preview,disableOverlay:c.disable_overlay,titleHidden:c.title_hidden,topPlacement:c.top_placement,metaDate:c.meta_date,metaComments:c.meta_comments,maxAgeDays:c.max_age_days};a.initPlacement(d),a.createDataCollections(d),a.run()}),a.set("innerContainerId",a.get("innerContainerName")+"-"+a.cid)},initPlacement:function(a){this.position=new i({placement:a.topPlacement?"top":"bottom",settings:a,adSupported:this.get("adSupported")}),c("#placement-"+this.position.placement).html(this.position.$el),this.listenToOnce(this.position,"recommendations:expanded",function(){this.trigger("recommendations:visible")})},createDataCollections:function(a){var b={name:"Organic",minLength:this.get("minLength"),maxLength:this.get("maxLength"),settings:a,forumUrl:this.get("sourceForum").url};this.threads=new g.RelatedThreadCollection([],b)},run:function(){var a=this;return a.getRecommendationsData().then(function(){return a.threads.length<a.get("minLength")?void d.debug("Not enough recommended threads, bailing out"):a.renderRecommendations()})["catch"](function(a){d.debug("Recommendations collection failed",a)})},getRecommendationsData:function(){var a={timeout:k,data:{thread:this.get("sourceThread").id},reset:!0,humanFriendlyTimestamp:!0};return this.threads.fetch(a,this.get("featuredComments"))},renderRecommendations:function(){var a=new h({app:this,threads:this.threads});this.position.tryPlacement(a)}}),j.init=function(a,c){var d=b.extend({},{sourceThread:a.toJSON(),sourceForum:a.forum.toJSON(),sourceThreadUrl:a.currentUrl||window.document.referrer,service:c.service,experiment:c.experiment,variant:c.variant,adSupported:c.adSupported}),e=new j.RecommendationsApp(d);return e},j}),define("recommendations.bundle",function(){});