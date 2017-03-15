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
    // the jQuery selector used is defined as the element (right to left):
    //     <div> that is not direct child of class starting with class="level"
    //     which in turns is direct child of <ul>
    //     which in turns is descendant of the class="acmenu"
    const _SELECTOR = "div.acmenu ul > :not([class^='level']) > div";
    var item_open = [];
    var one_click = "";
    var clicks = 0;

    // remember open items from previously cookies
    get_cookie();

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
            if (jQuery.inArray($item, item_open) == -1) {
                item_open.push($item);
            }
            var cookie_value = JSON.stringify(item_open);
            document.cookie = "item_open=" + cookie_value + ";expires='';path=/";
            window.location.replace(jQuery(this).find("a").attr("href"));
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
