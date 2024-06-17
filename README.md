# volto-gemini-alt-text

## Introduction

Using the Gemini API to generate a description and title for an image, and saving the title to the alt attribute.

## Usage

Add in your `.env` file of choice a variable:

```
RAZZLE_GEMINI_API_KEY= "Your Key"
```
Get an API key here: [Google](https://ai.google.dev/tutorials/setup)

## Installation

To install your project, you must choose the method appropriate to your version of Volto.

### Volto 17 and earlier

Create a new Volto project (you can skip this step if you already have one):

```
npm install -g yo @plone/generator-volto
yo @plone/volto my-volto-project --addon @danielnabil/volto-gemini-alt-text
cd my-volto-project
```

Add `@danielnabil/volto-gemini-alt-text`to your package.json:

```JSON
"addons": [
    "@danielnabil/volto-gemini-alt-text"
],

"dependencies": {
    "@danielnabil/volto-gemini-alt-text": "*"
}
```

Download and install the new add-on by running:


```
yarn install
```

Start Volto with:

```
yarn start
```

### Setup the environment

Run once

```shell
make dev
```

which will build and launch the backend and frontend containers.
There's no need to build them again after doing it the first time unless something has changed from the container setup.

In order to make the local IDE play well with this setup, is it required to run once `yarn` to install locally the required packages (ESlint, Prettier, Stylelint).

Run

```shell
yarn
```

### Build the containers manually

Run

```shell
make build-backend
make build-addon
```

### Run the containers

Run

```shell
make start-dev
```

This will start both the frontend and backend containers.

### Stop Backend (Docker)

After developing, in order to stop the running backend, don't forget to run:

Run

```shell
make stop-backend
```

### Linting

Run

```shell
make lint
```

### Formatting

Run

```shell
make format
```

### i18n

Run

```shell
make i18n
```

### Unit tests

Run

```shell
make test
```

### Acceptance tests

Run once

```shell
make install-acceptance
```

For starting the servers

Run

```shell
make start-test-acceptance-server
```

The frontend is run in dev mode, so development while writing tests is possible.

Run

```shell
make test-acceptance
```

To run Cypress tests afterwards.

When finished, don't forget to shutdown the backend server.

```shell
make stop-test-acceptance-server
```

### Release

Run

```shell
make release
```

For releasing a RC version

Run

```shell
make release-rc
```
## License

