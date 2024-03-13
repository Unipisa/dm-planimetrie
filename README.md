# DM-Planimetrie

<a href="https://www.npmjs.com/package/dm-planimetrie"><img src="https://img.shields.io/npm/v/dm-planimetrie" alt="npm version"></a>

This project is a JavaScript-based application that renders a planimetry of the
Department of Mathematics in Pisa, and lets you interact with it by selecting
rooms and querying a Database for various information about them.

It uses modern web technologies like Vite and React, and SCSS for styling.

## Project Structure

-   `src/`: Contains the source code for the application.

-   `public/`: Contains static files like images and 3D models.

-   `demo/`: Contains a prototype of the final widget.

-   `tool/`: Contains a tool for editing the planimetry.

-   `.github/`: Contains GitHub workflow files for deploying the site to Github Pages

## Development

To get started with this project, follow these steps:

```bash
# Clone the project
$ git clone https://github.com/Unipisa/dm-planimetrie
$ cd dm-planimetrie

# Install the required dependencies
$ npm install

# Start the ViteJS development server
$ npm run dev
```

After starting the server, you can view the application by opening your web browser and navigating to `http://localhost:3000/`

- [http://localhost:3000/demo/](http://localhost:3000/demo/) - The demo widget

- [http://localhost:3000/tool/](http://localhost:3000/tool/) - The tool for editing the planimetry

## Deployment

This project is [automatically deployed to GitHub Pages]() using GitHub Actions. To locally build the project, run the following command:

```bash
$ npm run build
```

## Wordpress Shortcode

```php
<?php

wp_register_script('dm-planimetrie', 'https://unipisa.github.io/dm-planimetrie/lib/dm-planimetrie-element.iife.js');

function planimetrie_shortcode( $atts ) {
    wp_enqueue_script('dm-planimetrie');

    return <<<EOF
    <dm-planimetrie></dm-planimetrie>
    EOF;
}

add_shortcode('planimetrie', 'planimetrie_shortcode');
```

```js
const element = document.querySelector('dm-planimetrie');
element.setSelection(['id1', 'id2', 'id3']);
```

## SketchUp Model Export

- Export the model from the SketchUp web app using the "Collada" exporter and set the following options

    - Export two-sided faces<b>\*</b>: **Yes**

    - Export edges<b>\*</b>: **Yes**

    - Triangulate all faces<b>\*</b>: **Yes**

    - Export hidden geometry: **No**

    - Preserve component hierarchy<b>\*</b>: **Yes**

    - Export texture maps<b>\*</b>: **Yes**

    - Preserve credits: **No**

    The one with \* are the important ones.

- Extract the generated `.zip` file

- This contains the main `.dae` file and a folder containing the embedded textures

- Now edit main `.dae` file and fix the textures directory. `Ctrl+F` for "Wood_", one of the results will look like the following

    ```xml
    <init_from>643caea7-fcbc-458d-b235-41120140542b/Wood_Bamboo_Medium.jpg</init_from>
    ```

    and change it to just

    ```xml
    <init_from>Wood_Bamboo_Medium.jpg</init_from>
    ```

    or just run the following command

    ```bash
    sed 's#<init_from>[^\/]*/#<init_from># dm.dae > dm-patched.dae'
    ```

- Then gzip the file using

    ```bash
    gzip -9 -c dm-patched.dae > dm.dae.gz
    ```

- In the end put `dm.dae.gz` and all the textures inside `public/`



rename the main `.dae` file to  

<!--
## React Usage (dm-manager?)

```jsx
const PlanimetrieWrapper = () => {
    const ref = useRef(null);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (ref.current) {
            ref.current.setSelection(selectedIds);
        }
    }, [selectedIds]);

    return (
        <dm-planimetrie ref={ref}> />
    );
};

```

-->