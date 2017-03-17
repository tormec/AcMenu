<?php
/**
 * AcMenu plugin: an accordion menu for namespaces and relative pages.
 *
 * syntax.php: it defines all the methods used by AcMenu plugin
 *     which extends DokuWiki's syntax.
 *
 * @author Torpedo <dgtorpedo@gmail.com>
 * @license GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @package syntax
 */

 if (!defined("DOKU_INC")) die();  // the plugin must be run within Dokuwiki

 /**
 * This class defines all the methods used by the AcMenu plugin to produce
 * the plugin's output.
 *
 * It extends DokuWiki's basic syntax defined in lib/plugins/syntax.php.
 *
 * @package syntax_acmenu
 */
class syntax_plugin_acmenu extends DokuWiki_Syntax_Plugin {

    /**
     * It defines the syntax types that this plugin applies when founds
     * its token: it is simply replaced.
     *
     * @return (str)
     */
    public function getType() {
        return "substition";
    }

    /**
     * It defines how the plugin's output is handled regarding paragraphs.
     *
     * Open paragraphs will be closed before plugin output and the plugin output
     * will not starts with a paragraph:
     *      <p>foo</p>
     *      <acmenu>
     *      <p>bar</p>
     *
     * @return (str)
     */
    public function getPType() {
        return "block";
    }

    /**
     * It defines the priority used to determine in which order modes are
     * added: the mode with the lowest sort number will win.
     *
     * Since this plugin provides internal links, it is sorted at:
     *      AcMenu plugin < Doku_Parser_Mode_internallink (= 300)
     *
     * @return (int)
     */
    public function getSort() {
        return 295;
    }

    /**
     * It defines the regular expression needed to match the plugin's syntax.
     *
     * This plugin use the following general syntax:
     *      <acmenu [list of parameters]>
     *
     * @param (str) $mode name for the format mode of the final output
     *              (at the present only $mode == "xhtml" is supported)
     */
    public function connectTo($mode) {
        $this->Lexer->addSpecialPattern("<acmenu.*?>", $mode, "plugin_acmenu");
    }

    /**
     * It handles the plugin's syntax matched.
     *
     * It is called every time the parser encounters the plugin's syntax in
     * order to produce a list of instructions for the renderer, which will
     * be interpreted later.
     *
     * @param (str) $match the text matched
     * @param (int) $state the lexer state
     * @param (int) $pos the character position of the matched text
     * @param (obj) $handler object reference to the Doku_Handler class,
     *              defined in inc/parser/handler.php
     * @return (arr) $data it contains the parameters handed to the
     *              plugin's syntax and found in the wiki page, that is:
     *              array {
     *              [0] => (str) ""
     *              }
     */
    public function handle($match, $state, $pos, Doku_Handler $handler) {
        $data = array();

        $match = substr($match, 7, -1);  // strips "<acmenu" and ">"

        return $data;
    }

    /**
     * It processes the list of instructions that render the final output.
     *
     * @param (str) $mode name for the format mode of the final output
     *              (at the present only $mode == "xhtml" is supported)
     * @param (obj) $renderer object reference to the Doku_Render class, defined
     *              in /inc/parser/renderer.php, which defines functions for the
     *              output (see also /lib/styles/screen.css for some styles)
     * @param (arr) $data it contains the parameters handed to the
     *              plugin's syntax and found in the wiki page, that is:
     *              array {
     *              [0] => (str) ""
     *              }
     */
    public function render($mode, Doku_Renderer $renderer, $data) {
        global $INFO;
        global $conf;

        // disable the cache
        $renderer->nocache();

        // call the function which build the directory tree
        $base_ns = $this->_get_base();  // namespace where was found the syntax
        $level = 0;
        $tree = $this->_tree($base_ns, $level);

        // get title and url(=id) for the base directory
        $sub_ns = $this->_sub($INFO["id"]);
        if ($base_ns == "") {
            $base_id = $conf["start"];
        }
        else {
            $base_id = $base_ns . $conf["start"];
        }
        $base_title = p_get_first_heading($base_id);
        if (isset($base_title) == false) {
            $base_title = $base_ns;
        }

        // get cookies and sanitize the href attribute
        $open_items = $_COOKIE["open_items"];
        if (isset($open_items) == true) {
            $open_items = json_decode($open_items);
            $re = "/doku.php?id=";
            foreach ($open_items as $key => $val) {
                $open_items[$key] = substr($val, strlen($re));
            }
        }

        // print the directory tree
        $renderer->doc .= "<div class='acmenu'>";
        $renderer->doc .= "<ul class='idx'>";
        $renderer->doc .= "<li class='open'>";
        $renderer->doc .= "<div class='li'>";
        if (in_array(chop($base_id, $conf["start"]), $sub_ns) == true and
            chop($base_id, $conf["start"]) != $INFO['namespace'] . ":") {
            $renderer->doc .= "<span class='curid'>";
            $renderer->internallink($base_id, $base_title);
            $renderer->doc .= "</span>";
        }
        else {
            $renderer->internallink($base_id, $base_title);
        }
        $renderer->doc .= "</div>";
        $renderer->doc .= "<ul class='idx'>";
        $tree = $this->_sort($tree);
        $this->_print($renderer, $tree, $sub_ns, $open_items);
        $renderer->doc .= "</ul>";
        $renderer->doc .= "</li>";
        $renderer->doc .= "</ul>";
        $renderer->doc .= "</div>";
        // only if javascript is enabled and only at the first time
        // hide the content of each namespace
        if (count($open_items) == 0) {
            $renderer->doc .= "<script type='text/javascript'>";
            $renderer->doc .= "jQuery('.dokuwiki div.acmenu ul.idx li.open ul.idx')
                               .css('display', 'none')
                               .parent().removeClass('open').addClass('closed');";
            $renderer->doc .= "</script>";
        }
    }

    /**
     * It gets the name of the namespace where was found the AcMenu's syntax.
     *
     * It starts from the current namespace (the namespace of the current page)
     * and goes up till he finds the base namespace (the namespace where
     * the page containing the AcMenu's syntax lives).
     *
     * @return (str) $base_ns the name of the namespace, where was found
     *     the AcMenu's syntax, of the form:
     *     <base_ns>:
     */
    private function _get_base() {
        global $INFO;
        global $conf;
        $base_ns = "";
        $path = $INFO["filepath"];  // <srv-path>/<data>/pages/<dir>/<file>.txt
        $dir = str_replace(basename($path), "", $path);
        if (file_exists($dir) == true) {
            // this the tree path searched:
            //     <srv-path>/<data>/pages/<dir>/
            //     <srv-path>/<data>/pages/
            while ($dir !== $conf["savedir"]) {
                $files = scandir($dir);
                if (in_array($conf["sidebar"] . ".txt", $files) == true) {
                    $re = "/(.*\/pages\/)/";
                    $base_ns = preg_replace($re, "", $dir);
                    $base_ns = str_replace("/", ":", $base_ns);
                    break;
                }
                else {
                    $re = "/" . basename($dir) . "\/$/";
                    $dir = preg_replace($re, "", $dir);
                }
            }
        }

        return $base_ns;
    }

    /**
     * It builds the tree directory starting from the base namespace (the
     * namespace where the page containing the AcMenu's syntax lives) to the
     * very end.
     *
     * @param (str) $base_ns the name of the namespace, where was found
     *              the AcMenu's syntax, of the form:
     *              <base_ns>:
     * @param (str) $level the level of indentation from which start
     * @return (arr) $tree the tree directory of the form:
     *              array {
     *              [0] => array {
     *                     ["title"] => (str) "<title>"
     *                     ["url"] => (str) "<url>"
     *                     ["level"] => (int) "<level>"
     *                     ["type"] => (str) "ns"
     *                     ["sub"] => array {
     *                                [0] => array {
     *                                       ["title"] => (str) "<title>"
     *                                       ["url"] => (str) "<url>"
     *                                       ["level"] => (int) "<level>"
     *                                       ["type"] => (str) "pg"
     *                                       }
     *                                [i] => array {...}
     *                                }
     *                     }
     *              [i] => array {...}
     *              }
     *              where:
     *              ["type"] = "ns" means "namespace"
     *              ["type"] = "pg" means "page"
     *              so that only namespace can have ["sub"] namespaces
     */
    private function _tree($base_ns, $level) {
        global $INFO;
        global $conf;
        $tree = array();
        $level = $level + 1;
        $dir = $conf["savedir"] ."/pages/" . str_replace(":", "/", $base_ns) . "/";
        $files = array_diff(scandir($dir), array('..', '.'));
        foreach ($files as $file) {
            if (is_file($dir . $file) == true) {
                $namepage = basename($file, ".txt");
                $id = $base_ns . $namepage;
                if (isHiddenPage($id) == false) {
                    if (auth_quickaclcheck($id) >= AUTH_READ) {
                        $title = p_get_first_heading($id);
                        if (isset($title) == false) {
                            $title = $namepage;
                        }
                        $tree[] = array("title" => $title,
                                        "url" => $id,
                                        "level" => $level,
                                        "type" => "pg");
                    }
                }
            }
            elseif (is_dir($dir . $file) == true) {
                $id = $base_ns . $file . ":"  . $conf["start"];
                if ($conf['sneaky_index'] == 1 and auth_quickaclcheck($id) < AUTH_READ) {
                    continue;
                }
                else {
                    $title = p_get_first_heading($id);
                    if (isset($title) == false) {
                        $title = $file;
                    }
                    $tree[] = array("title" => $title,
                                    "url" => $id,
                                    "level" => $level,
                                    "type" => "ns",
                                    "sub" => $this->_tree($base_ns . $file . ":", $level));
                }
            }
        }
        return $tree;
    }

    /**
     * It splits the current namespace (the namespace of the current page) in
     * all its ancestors.
     *
     * @param (str) $id the current namespace of the form:
     *              <base_ns>:<ns-1>:<ns-i>:<pg>
     * @return (arr) $sub_ns the anchestors of the current namespace, that is:
     *              array {
     *              [0] => (str) "<base_ns>:"
     *              [1] => (str) "<base_ns>:<ns-1>"
     *              [i] => (str) "<base_ns>:<ns-1>:<ns-i>"
     *              }
     */
    private function _sub($id) {
        $sub_ns = array();
        $pieces = explode(":", $id);
        $namepage = array_pop($pieces);

        $sub_ns[] = "";
        foreach ($pieces as $k => $v) {
            $sub_ns[] = end($sub_ns) . $pieces[$k] . ":";
        }

        return $sub_ns;
    }

    /**
     * It prints the tree directory.
     *
     * @param (obj) $renderer object reference to the Doku_Render class, defined
     *              in /inc/parser/renderer.php, which defines functions for the
     *              output (see also /lib/styles/screen.css for some styles)
     * @param (arr) $tree the tree directory of the form:
     *              array {
     *              [0] => array {
     *                     ["title"] => (str) "<title>"
     *                     ["url"] => (str) "<url>"
     *                     ["level"] => (int) "<level>"
     *                     ["type"] => (str) "ns"
     *                     ["sub"] => array {
     *                                [0] => array {
     *                                       ["title"] => (str) "<title>"
     *                                       ["url"] => (str) "<url>"
     *                                       ["level"] => (int) "<level>"
     *                                       ["type"] => (str) "pg"
     *                                       }
     *                                [i] => array {...}
     *                                }
     *                     }
     *              [i] => array {...}
     *              }
     *              where:
     *              ["type"] = "ns" means "namespace"
     *              ["type"] = "pg" means "page"
     *              so that only namespace can have ["sub"] namespaces
     * @param (arr) $open_items the namespaces to keep open in the form:
     *              array {
     *              [i] => (str) "<base_ns>:<ns-1>:<ns-i>"
     *              }
     * @return (arr) $sub_ns the anchestors of the current namespace, that is:
     *              array {
     *              [0] => (str) "<base_ns>:"
     *              [1] => (str) "<base_ns>:<ns-1>"
     *              [i] => (str) "<base_ns>:<ns-1>:<ns-i>"
     *              }
     */
    private function _print($renderer, $tree, $sub_ns, $open_items) {
        global $INFO;
        global $conf;
        foreach ($tree as $key => $val) {
            if ($val["type"] == "pg") {
                $renderer->doc .= "<li class='level" . $val["level"]."'>";
                $renderer->doc .= "<div class='li'>";
                $renderer->internallink($val["url"], $val["title"]);
                $renderer->doc .= "</div>";
                $renderer->doc .= "</li>";
            }
            elseif ($val["type"] == "ns") {
                if (isset($open_items) == true and
                    in_array($val["url"], $open_items) == false) {
                    $renderer->doc .= "<li class='closed'>";
                }
                else {
                    $renderer->doc .= "<li class='open'>";
                }
                $renderer->doc .= "<div class='li'>";
                if (in_array(chop($val["url"], $conf["start"]), $sub_ns) == true and
                    chop($val["url"], $conf["start"]) != $INFO['namespace']. ":") {
                    $renderer->doc .= "<span class='curid'>";
                    $renderer->internallink($val["url"], $val["title"]);
                    $renderer->doc .= "</span>";
                }
                else {
                    $renderer->internallink($val["url"], $val["title"]);
                }
                $renderer->doc .= "</div>";
                if (isset($open_items) == true and
                    in_array($val["url"], $open_items) == false) {
                    $renderer->doc .= "<ul class='idx' style='display: none'>";
                }
                else {
                    $renderer->doc .= "<ul class='idx'>";
                }
                $this->_print($renderer, $val["sub"], $sub_ns, $open_items);
                $renderer->doc .= "</ul>";
                $renderer->doc .= "</li>";
            }
        }
    }

    /**
     * It sorts the tree directory in ascending order.
     *
     * The tree is sorted in this order:
     *     first namespaces;
     *     than pages.
     * @param (arr) $tree the tree directory of the form:
     *              array {
     *              [0] => array {
     *                     ["title"] => (str) "<title>"
     *                     ["url"] => (str) "<url>"
     *                     ["level"] => (int) "<level>"
     *                     ["type"] => (str) "ns"
     *                     ["sub"] => array {
     *                                [0] => array {
     *                                       ["title"] => (str) "<title>"
     *                                       ["url"] => (str) "<url>"
     *                                       ["level"] => (int) "<level>"
     *                                       ["type"] => (str) "pg"
     *                                       }
     *                                [i] => array {...}
     *                                }
     *                     }
     *              [i] => array {...}
     *              }
     *              where:
     *              ["type"] = "ns" means "namespace"
     *              ["type"] = "pg" means "page"
     *              so that only namespace can have ["sub"] namespaces
     */
    private function _sort($tree) {
        $ns = array();
        $pg = array();

        foreach ($tree as $key => $val) {
            if ($val["type"] == "ns") {
                $val["sub"] = $this->_sort($val["sub"]);
                $ns[] = $val;
            }
            else {
                $pg[] = $val;
            }
        }
        sort($ns);
        sort($pg);
        $tree = array_merge($ns, $pg);

        return $tree;
    }
}
