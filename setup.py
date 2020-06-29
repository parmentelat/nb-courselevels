import setuptools

setuptools.setup(
    name="nb-courselevels",
    packages=['courselevels'],
    version='0.0.1',
    include_package_data=True,
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
