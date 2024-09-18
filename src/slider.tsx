import { h } from "preact"
import { Dom } from "OneJS/Dom"
import { math } from "Unity/Mathematics"
import { useCallback, useEffect, useRef } from "preact/hooks"
import { IPointerEvent, PointerDownEvent, PointerMoveEvent, PointerUpEvent } from "UnityEngine/UIElements"


function hasPointerCapture(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    return CS.UnityEngine.UIElements.PointerCaptureHelper.HasPointerCapture(e, pointerId)
}

function capturePointer(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    CS.UnityEngine.UIElements.PointerCaptureHelper.CapturePointer(e, pointerId)
}

function releasePointer(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    CS.UnityEngine.UIElements.PointerCaptureHelper.ReleasePointer(e, pointerId)
}

export interface SliderProps extends JSX.VisualElement {
    min?: number
    max?: number
    value?: number
    onChange?: (value: number) => void
    trackClass?: string
    trackStyle?: Partial<CS.OneJS.Dom.DomStyle>
    activeTrackClass?: string
    activeTrackStyle?: Partial<CS.OneJS.Dom.DomStyle>
    thumbClass?: string
    thumbStyle?: Partial<CS.OneJS.Dom.DomStyle>
}

export function Slider({ min: _min, max: _max, value: _value, onChange, onPointerDown, onPointerMove, onPointerUp, class: $class, trackClass, trackStyle, activeTrackClass, activeTrackStyle, thumbClass, thumbStyle, ...props }: SliderProps): Element {
    const trackRef = useRef<Dom>()
    const activeTrackRef = useRef<Dom>()

    const min = _min ?? 0
    const max = _max ?? 1
    const value = _value ?? min

    useEffect(() => {
        const ratio = math.unlerp(min, max, value)
        activeTrackRef.current.style.width = `${(ratio * 100).toFixed(2)}%`
    }, [min, max, value])

    const handlePointerDown = useCallback((e: PointerDownEvent) => {
        capturePointer(e.currentTarget, e.pointerId)
        handlerPointerEvent(e)
        onPointerDown?.(e)
    }, [onPointerDown])

    const handlePointerMove = useCallback((e: PointerMoveEvent) => {
        if (hasPointerCapture(e.currentTarget, e.pointerId)) {
            handlerPointerEvent(e)
        }
        onPointerMove?.(e)
    }, [onPointerMove])

    const handlePointerUp = useCallback((e: PointerUpEvent) => {
        if (hasPointerCapture(e.currentTarget, e.pointerId)) {
            releasePointer(e.currentTarget, e.pointerId)
        }
        onPointerUp?.(e)
    }, [onPointerUp])

    const handlerPointerEvent = useCallback((e: IPointerEvent) => {
        const width = trackRef.current.ve.layout.width
        const ratio = math.saturate(e.localPosition.x / width)
        activeTrackRef.current.style.width = `${(ratio * 100).toFixed(2)}%`
        onChange?.(math.lerp(min, max, ratio))
    }, [onChange, min, max])

    return (
        <div ref={trackRef} class={`h-8 justify-center ${$class ?? ""}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} {...props}>
            <div class={`h-2 bg-gray-400 rounded-[4px] ${trackClass ?? ""}`} style={trackStyle}>
                <div ref={activeTrackRef} class={`accented-bg-color h-2 rounded-[4px] ${activeTrackClass ?? ""}`} style={activeTrackStyle}>
                    <div class={`w-6 h-6 default-bg-color border border-gray-400 rounded-full absolute right-0 bottom-1 translate-3 ${thumbClass ?? ""}`} style={thumbStyle} />
                </div>
            </div>
        </div>
    )
}