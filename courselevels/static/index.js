// based on discussions here
// https://discourse.jupyter.org/t/styling-cells-through-metadata/4978/14
// https://github.com/jupyterlab/jupyterlab/pull/8410
// for starters we use this way of marking the cells
//
// metadata.tags.level_basic          
// metadata.tags.level_intermediate   
// metadata.tags.level_advanced       
//
// at most one should be present
// 
// and to materialize it in the DOM we do e.g.
// <div class="cell ..."
//     data-tag-basic=1 ...>


"use strict";

define(
    ['base/js/namespace', 
     'base/js/events'],
function (Jupyter, events) {

    let module = 'courselevels';

    let level_specs = {
        // the 'color' field will be filled from configuration
        // by initialize below
        level_basic: {
            icon: "hand-pointer-o", command_shortcut: "ctrl-x", edit_shortcut: "ctrl-x"},
        level_intermediate: {
            icon: "hand-peace-o", command_shortcut: "ctrl-y", edit_shortcut: "ctrl-y"},
        level_advanced: {
            icon: "hand-spock-o", command_shortcut: "ctrl-z", edit_shortcut: "ctrl-z"},
    };

    let levels = Object.keys(level_specs);

    function current_level(cell) {
        if (! ('metadata' in cell)) {
            return null;
        }
        if (! ('tags' in cell.metadata)) {
            return null;
        }
        let tags = cell.metadata.tags;
        for (let level of levels) 
            if (tags.indexOf(level) >= 0)
                return level;
        return null;
    }

    function toggle_level(level) {
        let cells = Jupyter.notebook.get_selected_cells();
        for (let cell of cells) {
            if (! ('metadata' in cell))
                cell.metadata = {};
            if (! ('tags' in cell.metadata))
                cell.metadata.tags = [];
            let tags = cell.metadata.tags;
            let level_index = tags.indexOf(level);
            if (level_index < 0) {
                for (let otherlevel of levels) {
                    let otherlevel_index = tags.indexOf(otherlevel);
                    if (otherlevel_index >= 0) 
                        tags.splice(otherlevel_index)
                }
                tags.push(level);
            } else {
                tags.splice(level_index, 1);
            }
            propagate(cell);
        }
    }

    function propagate(cell) {
        let level = current_level(cell);
        let element = cell.element;
        function add_level_in_dom(level) {
            element.attr(`data-tag-${level}`, true);
        }
        function del_level_in_dom(level) {
            element.removeAttr(`data-tag-${level}`);
        }
        for (let otherlevel of levels) {
            if (otherlevel == level) 
                add_level_in_dom(otherlevel);
            else
                del_level_in_dom(otherlevel);
        }
    }

    function propagate_all_cells() {
        Jupyter.notebook.get_cells().forEach(propagate);
    }

    function compute_css() {
        let css = `
/*div.cell.selected,*/
div.cell.jupyter-soft-selected {
    background-image: 
        url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill-opacity="0.4" d="M1 3h1v1H1V3zm2-2h1v1H3V1z"></path></svg>');
}
`;
        for (let [level, details] of Object.entries(level_specs))
            css += `
div.cell[data-tag-${level}=true] {
    background-color: ${details.color};
}
`;
        return css;
    }

    function inject_css () {
        let style = document.createElement("style");
        style.innerHTML = compute_css();
        document.getElementsByTagName("head")[0].appendChild(style);
    }

    function create_menubar_buttons(actions) {
        Jupyter.toolbar.add_buttons_group(actions);
    }

    function define_keyboard_shortcuts() {
        let command_shortcuts = Jupyter.keyboard_manager.command_shortcuts;
        let edit_shortcuts = Jupyter.keyboard_manager.edit_shortcuts;
        for (let [level, details] of Object.entries(level_specs)) {
            if ('command_shortcut' in details)
                command_shortcuts.set_shortcut(
                    details.command_shortcut, `${module}:toggle-${level}`);
            if ('edit_shortcut' in details)
                edit_shortcuts.set_shortcut(
                    details.edit_shortcut, `${module}:toggle-${level}`);
        }
    }

    function initialize() {

        console.log(`initializing ${module}`)

        // mirroring the yaml file
        let params = {
            create_menubar_buttons: true,
            define_keyboard_shortcuts: true,
            basic_color: "#d2fad2",
            intermediate_color: "#d2d2fb",
            advanced_color: "#f1d1d1",
        }

        let nbext_configurator = Jupyter.notebook.config;
        nbext_configurator.load();

        Promise.all([
            nbext_configurator.loaded,
        ]).then(()=>{
            // from nbconfig/notebook.json
            // will be EMPTY at first, it does not expose the defaults 
            // stored in YAML, hence the need to duplicate in the local params variable
            // console.log("config.data.courselevels", Jupyter.notebook.config.data.courselevels);

            // merge user-defined with defaults 
            $.extend(true, params, Jupyter.notebook.config.data.courselevels);

            // show merged config            
            //console.log("params", params);

            let actions = [];
            for (let [level, details] of Object.entries(level_specs)) {
                // extract e.g. basic or advanced
                let name = level.split('_')[1];
                let colorname = `${name}_color`;
                let color = params[colorname];
                // store configured color in level_specs in field 'color'
                level_specs[level].color = color;
                actions.push(
                    Jupyter.keyboard_manager.actions.register ({
                        help : `Toggle ${level}`,
                        icon : `fa-${details.icon}`,
                        handler : () => toggle_level(level),
                    }, `toggle-${level}`, module));
                }

            inject_css();
            // apply initial status
            propagate_all_cells();
            if (params.create_menubar_buttons) create_menubar_buttons(actions);
            if (params.define_keyboard_shortcuts) define_keyboard_shortcuts();
        });
    }

    function load_jupyter_extension() {
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook already loaded. Update directly
            initialize();
        }
        events.on("notebook_loaded.Notebook", initialize);
    }

    return {
        'load_ipython_extension': load_jupyter_extension,
        'load_jupyter_extension': load_jupyter_extension
    };

})
