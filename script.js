/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * script.js: it defines the accordion menu behaviour used by AcMenu plugin.
 *
 * @author Torpedo <dgtorpedo@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package script
 */

jQuery(document).ready(function() {
    // only if the browser enables javascript hide the content of each namespace
    //jQuery(".dokuwiki div.acmenu ul.idx li.closed ul.idx").css("display", "none");
    //jQuery(".dokuwiki div.page.group").css("min-height", "");

    // the jQuery selector used is defined as the element (right to left):
    //     <div> that is not direct child of class starting with class="level"
    //     which in turns is direct child of <ul>
    //     which in turns is descendant of the class="acmenu"
    const _SELECTOR = "div.acmenu ul > :not([class^='level']) > div";
    const _HREF = /\/doku\.php?id=.*/g;
    var item_open = [];
    var one_click = "";
    var clicks = 0;

    // remember open items from previously cookies
    get_cookie();
    if (item_open.length == 0) {
        jQuery(".dokuwiki div.acmenu ul.idx li.open ul.idx")
        .css("display", "none")
        .parent().removeClass("open").addClass("closed");
        jQuery(".dokuwiki div.page.group").css("min-height", "");
    }

    // implementation of "one click" and "double click" behaviour:
    // "double click" has effect only if occurs in less X milliseconds,
    // where X is the time lapse defined in setTimeout
    jQuery(_SELECTOR).click(function(event) {
        // redefine "this" in outer scope in order to be used in setTimeout
        var that = this;

        var $item = jQuery(this).find("a").attr("href");
        clicks = clicks + 1;
        if (clicks == 1) {
            event.preventDefault();
            one_click = window.setTimeout(function () {
                clicks = 0;
                if (jQuery(that).next().is(":visible") == false) {
                    jQuery(that)
                    .next().slideDown("fast")
                    .parent().removeClass("closed").addClass("open");
                    item_open.push($item);
                }
                else {
                    jQuery(that)
                    .next().slideUp("fast")
                    .parent().removeClass("open").addClass("closed");
                    item_open.splice(jQuery.inArray($item, item_open), 1);
                }
                var cookie_value = JSON.stringify(item_open);
                document.cookie = "item_open=" + cookie_value + ";expires='';path=/";
            }, 300);
        }
        else if (clicks == 2) {
            clearTimeout(one_click);

            clicks = 0;
            var url = window.location.toString();
            if (jQuery.inArray($item, item_open) == -1) {
                item_open.push($item);
            }
            var cookie_value = JSON.stringify(item_open);
            document.cookie = "item_open=" + cookie_value + ";expires='';path=/";
            window.location = url.replace(_HREF, jQuery(this).find("a").attr("href"));
        }
    });

    // recover previously cookies in order to remember which item is open
    function get_cookie() {
        // cookies are of the form:
        // <other-cookies>=["val-1",..,"val-m"]; item_open=["val-1",..,"val-n"]
        var all_cookies = document.cookie.split("; ");
        for (var i = 0; i < all_cookies.length; i++) {
            if (all_cookies[i].indexOf("item_open") > -1) {
                var cookies = all_cookies[i];
                const _COOKIE_NAME = /(item_open=\[")(.*)("\])/g;
                var cookies = cookies.replace(_COOKIE_NAME, "$2");
                var cookies = cookies.split('","');
                for (var j = 0; j < cookies.length; j++) {
                    item_open.push(cookies[j]);
                }
            }
        }
    };
});
