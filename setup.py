#!/usr/bin/env python

import setuptools

with open("README.md") as feed:
    LONG_DESCRIPTION = feed.read()

setuptools.setup(
    name="nb-courselevels",
    version='0.1.1',
    long_description=LONG_DESCRIPTION,
    long_description_content_type = "text/markdown",
    include_package_data=True,
    packages=['courselevels'],
    install_requires=[
        'notebook', 'jupyter_nbextensions_configurator'
    ],
    data_files=[
        # like `jupyter nbextension install --sys-prefix`
        ("share/jupyter/nbextensions/courselevels", [
            "courselevels/static/index.js", "courselevels/static/nb-courselevels.yaml"
        ]),
        # like `jupyter nbextension enable --sys-prefix`
        ("etc/jupyter/nbconfig/notebook.d", [
            "jupyter-config/nbconfig/notebook.d/nb-courselevels.json"
        ])
    ],
    zip_safe=False
)
