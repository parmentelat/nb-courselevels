import setuptools

setuptools.setup(
    name="nb_colorcells",
    packages=['nb_colorcells'],
    version='0.0.1',
    include_package_data=True,
    install_requires=[
        'notebook', 'jupyter_nbextensions_configurator'
    ],
    data_files=[
        # like `jupyter nbextension install --sys-prefix`
        ("share/jupyter/nbextensions/nb_colorcells", [
            "nb_colorcells/static/index.js", "nb_colorcells/static/nb-colorcells.yaml"
        ]),
        # like `jupyter nbextension enable --sys-prefix`
        ("etc/jupyter/nbconfig/notebook.d", [
            "jupyter-config/nbconfig/notebook.d/nb-colorcells.json"
        ])
    ],
    zip_safe=False
)
