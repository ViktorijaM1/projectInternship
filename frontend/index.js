/**
 * Import all internal indexes, thus including the code in the final build.
 * export all content representing the surface of your plugin API. Noone is expected to call, but wth.
 * Wait to be called for render, Core will call you.
 */

import ExampleName from "./components/ExampleName"

import ModuleComponentWrapper from "./name-project/ModuleComponentWrapper"



const routes = [{
    name: 'module-entry-screen-route-name',
    path: '/main/module-entry-screen',
    render: ExampleName,
    isExact: true
}

]

export { ExampleName, routes }


