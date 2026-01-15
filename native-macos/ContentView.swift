import SwiftUI

struct ContentView: View {
    // Points to the local Vite dev server
    let url = URL(string: "http://localhost:5173")!
    
    var body: some View {
        ZStack(alignment: .top) {
            WebView(url: url)
                .frame(minWidth: 800, minHeight: 600)
            
            // Drag Handle Overlay - Covers the top margin/padding
            // Adjusted to avoid blocking buttons if possible, but providing a grab area
            DraggableArea()
                .frame(height: 28) // Sufficient height for a title bar feel
                .frame(maxWidth: .infinity)
        }
        .background(WindowAccessor { window in
            guard let window = window else { return }
            window.titleVisibility = .hidden
            window.styleMask.insert(.fullSizeContentView)
            window.titlebarAppearsTransparent = true
            window.isMovableByWindowBackground = true
            // window.standardWindowButton(.zoomButton)?.isHidden = true
            // window.standardWindowButton(.miniaturizeButton)?.isHidden = true
            
            // Ensure traffic light buttons are visible and interactable
            window.standardWindowButton(.closeButton)?.isHidden = false
            window.standardWindowButton(.miniaturizeButton)?.isHidden = false
            window.standardWindowButton(.zoomButton)?.isHidden = false
        })
    }
}
