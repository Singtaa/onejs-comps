import { h } from "preact"
import jsonData from "../resources/fontawesome.json"

// const jsonData = require("./fontawesome.json")
const fontDef = resource.loadFontDefinition("assets/@onejs-comps/fontawesome.ttf")

export interface FontAwesomeProps {
    class?: string
    style?: Partial<CS.OneJS.Dom.DomStyle>
    name: keyof typeof jsonData
}

export const FAIcon = ({ class: classProp, name, style }: FontAwesomeProps) => {
    let id = jsonData[name]
    classProp = classProp || ""

    return <div class={`${classProp}`} style={{ ...style, unityFontDefinition: fontDef }}>{String.fromCodePoint(id)}</div>
}