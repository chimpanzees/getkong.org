$(function(){$(".navbar-toggle").on("click",function(){var t=$($(this).data("target"));t.slideToggle(150)}),$(".toggle-page-section").on("click",function(t){t.preventDefault();var e=$(this);e.parent().next(".page-section").stop().slideToggle(300,function(){e.toggleClass("active")})});var t=$(".tab-list li"),e=$(".tab-pane");t.on("click",function(a,n){a.preventDefault();var i=$(this).find("a").attr("href");t.removeClass("active").filter(this).addClass("active"),e.removeClass("active").filter(i).addClass("active"),history.pushState?history.pushState(null,null,i):location.hash=i,n||analytics.track("Choose installation method",{installationMethod:i.substr(1)})}),location.hash&&t.find('a[href="'+location.hash+'"]').trigger("click",!0),Parse.initialize("ZFqEMoCQSm0K4piYYdstraJDOl0a80tJB7R0tR49","SdqL88SikiiftwBjEGfRb4SmbghTIycZ2kfy7Jb0"),$(".subscribe-form").on("submit",function(t){t.preventDefault();for(var e=$(this),a=e.serializeArray(),n=Parse.Object.extend("Subscription"),i=new n,s={},o=0;o<a.length;o++)s[a[o].name]=a[o].value;analytics.identify($.extend({environment:"kong",userId:s.email},s)),i.save(s,{success:function(){e.fadeOut(300,function(){$(".success-message").fadeIn(300)})},error:function(){e.fadeOut(300,function(){$(".error-message").fadeIn(300)})}})}),$('[href^="/download"]').each(function(){var t=$(this);analytics.trackLink(this,"Clicked download",{section:t.closest(".navbar").length?"header":"page",pathname:location.pathname,type:t.hasClass("button")?"button":"link"})})});
//# sourceMappingURL=maps/app.js.map