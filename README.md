# courselevels

Jupyter notebook extension for 
* background colouring of cells (3 predefined colors)
* creating framed cells

# UI

Three buttons are provided that toggle the colour of selected cells
(1 finger = basic, 2 fingers = intermediate, 4 fingers = advanced/expert)
In addition a button allows to add/remove a frame around the selected cells

This is designed for flagging course contents, so that students can better navigate it;
color code is as follows

- basic (green)
- intermediate (blue)
- advanced/expert (red)

see an example in `examples/README`

# config

Can be customized through the nbextensions-configurator panel
Also the following actions can be attached to keyboard sohrtcuts using Jupyter's shortcuts editor

* courselevels:toggle-basic
* courselevels:toggle-intrmediate
* courselevels:toggle-advanced
* courselevels:toggle-frame

# installation 

Install via:

`pip install nb-courselevels`

The extension should be automatically installed and enabled.
