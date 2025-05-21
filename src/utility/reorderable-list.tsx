import { h } from "preact"
import { clsx } from "clsx"
import { useRef, useState, useEffect } from "preact/hooks"
import { ClickEvent, PointerDownEvent, PointerMoveEvent, PointerUpEvent } from "UnityEngine/UIElements"

interface ReorderableListProps<T> {
    items: T[]
    renderItem: (props: {
        item: T
        index: number
        isDragging: boolean
        dragHandleProps: {
            onPointerDown: (e: PointerDownEvent) => void
        }
    }) => Element
    onReorder?: (draggedItem: T, newIndex: number) => void
    itemHeight?: number
    className?: string
    itemKey?: (item: T, index: number) => string | number
}

export function ReorderableList<T>({
    items,
    renderItem,
    onReorder,
    itemHeight = 64,
    className = "",
    itemKey = (_, index) => index
}: ReorderableListProps<T>) {
    // Internal state to track items
    const [currentItems, setCurrentItems] = useState<T[]>(items)

    // Drag states
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [originalItems, setOriginalItems] = useState<T[]>([])
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)
    const startY = useRef(0)
    const originalIndex = useRef(-1)

    // Update currentItems when items prop changes (if not dragging)
    useEffect(() => {
        if (!isDragging) {
            setCurrentItems(items)
        }
    }, [items, isDragging])

    function handlePointerDown(index: number, e: PointerDownEvent) {
        originalIndex.current = index
        startY.current = e.position?.y || 0
        setOriginalItems([...currentItems])
        setDragOffset(0)
        setIsDragging(true)
        setHoverIndex(index)
    }

    function handlePointerMove(e: PointerMoveEvent) {
        if (!isDragging || originalIndex.current === -1) return
        capturePointer(e.currentTarget, e.pointerId)

        const py = e.position?.y || 0
        const diff = py - startY.current
        setDragOffset(diff)

        // Calculate hover position
        const finalPos = originalIndex.current * itemHeight + diff
        let newHover = Math.floor((finalPos + itemHeight / 2) / itemHeight)
        newHover = Math.min(Math.max(newHover, 0), originalItems.length - 1)
        setHoverIndex(newHover)
    }

    function handlePointerUp(e: PointerUpEvent) {
        if (isDragging && hoverIndex !== null && hoverIndex !== originalIndex.current) {
            // Get the dragged item
            const draggedItem = originalItems[originalIndex.current]

            // Create new array for visual update
            const newItems = [...originalItems]
            newItems.splice(originalIndex.current, 1)
            newItems.splice(hoverIndex, 0, draggedItem)
            setCurrentItems(newItems)

            // Notify parent component
            if (onReorder) {
                onReorder(draggedItem, hoverIndex)
            }
        }

        reset(e)
    }

    function reset(e: any) {
        releasePointer(e.currentTarget, e.pointerId)
        setIsDragging(false)
        setHoverIndex(null)
        setDragOffset(0)
        originalIndex.current = -1
    }

    return <div class={clsx("w-full relative", className)} style={{ height: itemHeight * currentItems.length }}>
        {(isDragging ? originalItems : currentItems).map((item, i) => {
            // Skip rendering the dragged item in its original position
            if (isDragging && i === originalIndex.current) return null

            let adjustedI = i
            if (isDragging && hoverIndex !== null) {
                const oi = originalIndex.current
                const hi = hoverIndex
                if (oi < hi && i > oi && i <= hi) adjustedI = i - 1
                if (oi > hi && i < oi && i >= hi) adjustedI = i + 1
            }

            return <div
                key={itemKey(item, i)}
                class={clsx(
                    "absolute w-full",
                    isDragging && "pointer-events-none"
                )}
                style={{
                    top: adjustedI * itemHeight,
                    height: itemHeight,
                    transition: "top 0.2s ease"
                }}
            >
                {renderItem({
                    item,
                    index: i,
                    isDragging: false,
                    dragHandleProps: {
                        onPointerDown: (e) => handlePointerDown(i, e)
                    }
                })}
            </div>
        })}

        {isDragging && originalIndex.current !== -1 && (
            <div
                class="absolute w-full"
                style={{
                    top: originalIndex.current * itemHeight + dragOffset,
                    height: itemHeight
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp as any}
            >
                {renderItem({
                    item: originalItems[originalIndex.current],
                    index: originalIndex.current,
                    isDragging: true,
                    dragHandleProps: {
                        onPointerDown: () => { } // No-op because we're already dragging
                    }
                })}
            </div>
        )}
    </div>
}

function hasPointerCapture(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    return CS.UnityEngine.UIElements.PointerCaptureHelper.HasPointerCapture(e, pointerId)
}

function capturePointer(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    CS.UnityEngine.UIElements.PointerCaptureHelper.CapturePointer(e, pointerId)
}

function releasePointer(e: CS.UnityEngine.UIElements.IEventHandler, pointerId: number) {
    CS.UnityEngine.UIElements.PointerCaptureHelper.ReleasePointer(e, pointerId)
}