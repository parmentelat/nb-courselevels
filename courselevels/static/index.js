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


"use strict"

define(
    ['base/js/namespace', 
     'base/js/events'],
function (Jupyter, events) {

    const module = 'courselevels'

    const level_specs = {
        // the 'color' field will be filled from configuration
        // by initialize below
        level_basic: { icon: "hand-pointer-o"},
        level_intermediate: { icon: "hand-peace-o"},
        level_advanced: { icon: "hand-spock-o"},
    }
    const FRAME_TAG = 'framed_cell'
    const frame_specs = { 
        'frame' : { icon: "crop"},
    }
    const all_specs = Object.entries(level_specs).concat(Object.entries(frame_specs))

    let levels = Object.keys(level_specs)

    function current_level(cell) {
        if (! ('metadata' in cell)) {
            return null
        }
        if (! ('tags' in cell.metadata)) {
            return null
        }
        let tags = cell.metadata.tags
        for (let level of levels) 
            if (tags.indexOf(level) >= 0)
                return level
        return null
    }

    function get_tags(cell) {
        if (! ('metadata' in cell))
            cell.metadata = {}
        if (! ('tags' in cell.metadata))
            cell.metadata.tags = []
        return cell.metadata.tags
    }
    function has_tag(cell, tag) {
        return cell.metadata.tags.includes(tag)
    }
    function add_tag(cell, tag) {
        cell.metadata.tags.push(tag)
    }
    function remove_tag(cell, tag) {
        cell.metadata.tags = cell.metadata.tags.filter( (item) => item != tag )
    }

    function toggle_level(level) {
        let cells = Jupyter.notebook.get_selected_cells()
        for (let cell of cells) {
            let tags = get_tags(cell)
            if (has_tag(cell, level)) {
                remove_tag(cell, level)
            } else {
                for (let otherlevel of levels)
                    remove_tag(cell, otherlevel)
                add_tag(cell, level)
            }
            propagate(cell)
        }
    }

    function toggle_frame() {
        let cells = Jupyter.notebook.get_selected_cells()
        for (let cell of cells) {
            let tags = get_tags(cell)
            if (tags.includes(FRAME_TAG))
                remove_tag(cell, FRAME_TAG)
            else
                tags.push(FRAME_TAG)
            propagate(cell)
        }
    }

    function propagate(cell) {
        let level = current_level(cell)
        let element = cell.element
        for (let otherlevel of levels) {
            if (otherlevel == level) 
                element.attr(`data-tag-${otherlevel}`, true)
            else
                element.removeAttr(`data-tag-${otherlevel}`)
        }
        if (get_tags(cell).includes(FRAME_TAG))
            element.attr(`data-tag-frame`, true)
        else
            element.removeAttr(`data-tag-frame`)
    }

    function propagate_all_cells() {
        Jupyter.notebook.get_cells().forEach(propagate)
    }

    /* when multiple cells are selected, they are rendered with a single color too
       and it can be confusing so when the extension is enabled, multi-selection
       is rendered using a dedicated background pattern instead, so that 
       one can still see information related to levels (color) and selection (pattern)
    */
    function compute_css() {
        let css = `
/*div.cell.selected,*/
div.cell.jupyter-soft-selected {
    background-image: 
        url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill-opacity="0.4" d="M1 3h1v1H1V3zm2-2h1v1H3V1z"></path></svg>');
}
`
        for (let [level, details] of Object.entries(level_specs))
            css += `
div.cell[data-tag-${level}=true] {
    background-color: ${details.color};
}
`
        css += `
div.cell[data-tag-frame=true] {
    border: ${frame_specs.frame.style};
}
`
        return css
    }

    function inject_css () {
        let style = document.createElement("style")
        style.innerHTML = compute_css()
        document.getElementsByTagName("head")[0].appendChild(style)
    }

    function create_menubar_buttons(actions) {
        Jupyter.toolbar.add_buttons_group(actions)
    }

    function initialize() {

        console.log(`initializing ${module}`)

        // mirroring the yaml file
        let params = {
            create_menubar_buttons: true,
            basic_color: "#d2fad2",
            intermediate_color: "#d2d2fb",
            advanced_color: "#f1d1d1",
            frame_style: "3px ridge #400",
        }

        let nbext_configurator = Jupyter.notebook.config
        nbext_configurator.load()

        Promise.all([
            nbext_configurator.loaded,
        ]).then(()=>{
            // from nbconfig/notebook.json
            // will be EMPTY at first, it does not expose the defaults 
            // stored in YAML, hence the need to duplicate in the local params variable
            // console.log("config.data.courselevels", Jupyter.notebook.config.data.courselevels)

            // merge user-defined with defaults 
            $.extend(true, params, Jupyter.notebook.config.data.courselevels)

            // show merged config            
            //console.log("params", params)

            let actions = []
            for (let [level, details] of Object.entries(level_specs)) {
                // extract e.g. basic or advanced
                let name = level.split('_')[1]
                let colorname = `${name}_color`
                let color = params[colorname]
                // store configured color in level_specs in field 'color'
                level_specs[level].color = color
                actions.push(
                    Jupyter.keyboard_manager.actions.register ({
                        help : `Toggle ${level}`,
                        icon : `fa-${details.icon}`,
                        handler : () => toggle_level(level),
                    }, `toggle-${name}`, module))
                }
            frame_specs.frame.style = params.frame_style
            actions.push(
                Jupyter.keyboard_manager.actions.register({
                    help: `Toggle frame around cell`,
                    icon: `fa-${frame_specs.frame.icon}`,
                    handler: toggle_frame,
                }, 'toggle-frame', module))

            inject_css()
            // apply initial status
            propagate_all_cells()
            if (params.create_menubar_buttons) 
                create_menubar_buttons(actions)
        })
    }

    function load_jupyter_extension() {
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook already loaded. Update directly
            initialize()
        }
        events.on("notebook_loaded.Notebook", initialize)
    }

    return {
        'load_ipython_extension': load_jupyter_extension,
        'load_jupyter_extension': load_jupyter_extension
    }

})
