import SwiftUI

struct DraggableArea: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = DraggableView()
        return view
    }
    
    func updateNSView(_ nsView: NSView, context: Context) {}
    
    class DraggableView: NSView {
        override var mouseDownCanMoveWindow: Bool {
            return true
        }
        
        override func draw(_ dirtyRect: NSRect) {
            // Transparent
            NSColor.clear.set()
            dirtyRect.fill()
        }
    }
}
