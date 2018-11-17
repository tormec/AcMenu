<?php
/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * action.php: it defines all the methods used by AcMenu plugin
 *     who interact with DokuWiki's events.
 *
 * @author Torpedo <dcstoyanov@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package action
 */

if (!defined('DOKU_INC')) die();  // the plugin must be run within Dokuwiki

/**
 * This class defines all the methods used by the AcMenu plugin to interact
 * with the DokuWiki's events.
 *
 * It extends DokuWiki's basic action defined in lib/plugins/action.php.
 *
 * @package action_pycode
 */
class action_plugin_acmenu extends DokuWiki_Action_Plugin {

    /**
     * Register the event handlers
     */
    function register(Doku_Event_Handler $controller) {
        $controller->register_hook("DOKUWIKI_STARTED", "AFTER",  $this, "_add_user_conf", array());
    }

    /**
     * Add some user's configuration to the $JSINFO variable.
     *
     * @param object $event
     *      the event object
     * @param array $param
     *      data passed when this handler was registered
     */
    function _add_user_conf(Doku_Event $event, $param) {
        global $conf;
        global $INFO;
        global $JSINFO;
        $JSINFO["plugin_acmenu"]["doku_base"] = DOKU_BASE;
        $JSINFO["plugin_acmenu"]["doku_url"] = DOKU_URL;
        $JSINFO["plugin_acmenu"]["doku_script"] = DOKU_SCRIPT;
        $JSINFO["plugin_acmenu"]["start"] = $conf["start"];
        $JSINFO["plugin_acmenu"]["useslash"] = $conf["useslash"];
        $JSINFO["plugin_acmenu"]["canonical"] = $conf["canonical"];
        $JSINFO["plugin_acmenu"]["userewrite"] = $conf["userewrite"];
        $JSINFO["plugin_acmenu"]["sub_ns"] = $INFO["meta"]["plugin"]["plugin_acmenu"]["sub_ns"];
    }
}
